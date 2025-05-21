import { getAuth } from "./firebase-client"
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendPasswordResetEmail
} from "firebase/auth"
import { db } from "./config"
import { doc, getDoc, collection, query, where, getDocs, serverTimestamp, updateDoc } from "firebase/firestore"
import { VendorCredential } from "./vendor-schema"
import { setVendorSessionCookies, clearVendorSessionCookies } from "./set-session-cookie"

// Sign in with email and password specific for vendors
export const signInVendor = async (email: string, password: string) => {
  try {
    const auth = getAuth()
    if (!auth) {
      console.error("Firebase auth not initialized")
      return { 
        success: false, 
        error: new Error("Firebase authentication not initialized. Please check your Firebase configuration.") 
      }
    }

    // For development without Firebase, allow a test account
    if (process.env.NODE_ENV === 'development' && email === 'test@example.com' && password === 'password') {
      console.log('Using test vendor account in development mode')
      
      // Set session cookies for test account
      setVendorSessionCookies('test-vendor-id', true);
      
      // Return a successful login with test data
      return { 
        success: true, 
        user: { uid: 'test-vendor-id' },
        vendorData: {
          id: 'test-vendor-id',
          uid: 'test-vendor-id',
          name: 'Test Vendor',
          email: 'test@example.com',
          phone: '1234567890',
          address: 'Test Address',
          pincodes: ['123456'],
          role: 'vendor',
          status: 'active',
          productsCount: 0,
          joinedDate: new Date().toISOString(),
          profileComplete: true
        }
      }
    }

    // Only attempt Firebase auth if we're not using the test account
    const userCredential = await signInWithEmailAndPassword(auth, email, password)
    const userUid = userCredential.user.uid
    
    console.log("User authenticated, checking vendor status: ", userUid)
    
    // Check if user has vendor role - first try direct UID
    let vendorDoc = await getDoc(doc(db, "vendors", userUid))
    let vendorId = userUid
    
    // If not found, check for vendor with prefix pattern (created by admin)
    if (!vendorDoc.exists()) {
      console.log("Vendor not found by direct UID, checking vendor_ prefix")
      const vendorPrefixId = `vendor_${userUid}`
      vendorDoc = await getDoc(doc(db, "vendors", vendorPrefixId))
      if (vendorDoc.exists()) {
        vendorId = vendorPrefixId
      }
    }
    
    // If still no vendor doc, check by email as a last resort
    if (!vendorDoc.exists()) {
      console.log("Vendor not found by prefixed ID, trying to find by email")
      const vendorsQuery = query(
        collection(db, "vendors"), 
        where("email", "==", email)
      )
      
      const querySnapshot = await getDocs(vendorsQuery)
      if (!querySnapshot.empty) {
        vendorDoc = querySnapshot.docs[0]
        vendorId = vendorDoc.id
      } else {
        throw new Error("No vendor account found for this user")
      }
    }
    
    // Check if vendor is active
    const vendorData = vendorDoc.data() as VendorCredential
    if (vendorData.status === "blocked") {
      throw new Error("Your vendor account has been blocked. Please contact support.")
    }
    
    if (vendorData.status === "pending") {
      throw new Error("Your vendor account is pending approval. Please wait for admin approval.")
    }
    
    // Update last login timestamp
    await updateDoc(doc(db, "vendors", vendorId), {
      lastLogin: serverTimestamp()
    })
    
    // Set session cookies for authenticated vendor
    setVendorSessionCookies(userUid, false);
    
    return { 
      success: true, 
      user: userCredential.user,
      vendorData: {
        id: vendorId,
        ...vendorData
      }
    }
  } catch (error: any) {
    console.error("Vendor sign-in error:", error)
    
    // Provide user-friendly error messages
    let errorMessage = "Failed to sign in. Please check your email and password."
    
    if (error.code === 'auth/invalid-credential') {
      errorMessage = "Invalid email or password"
    } else if (error.code === 'auth/user-disabled') {
      errorMessage = "This account has been disabled"
    } else if (error.code === 'auth/user-not-found') {
      errorMessage = "No account found with this email"
    } else if (error.code === 'auth/wrong-password') {
      errorMessage = "Incorrect password"
    } else if (error.code === 'auth/too-many-requests') {
      errorMessage = "Too many unsuccessful login attempts. Please try again later."
    } else if (error.code === 'auth/invalid-api-key') {
      errorMessage = "Firebase configuration error. Please contact support."
    } else if (error.message) {
      errorMessage = error.message
    }
    
    return { 
      success: false, 
      error: new Error(errorMessage) 
    }
  }
}

// Sign out vendor
export const signOutVendor = async () => {
  try {
    const auth = getAuth()
    if (!auth) {
      return { 
        success: false, 
        error: new Error("Firebase authentication not initialized") 
      }
    }
    
    // Clear session cookies
    clearVendorSessionCookies();
    
    await firebaseSignOut(auth)
    return { success: true }
  } catch (error: any) {
    console.error("Vendor sign-out error:", error)
    return { 
      success: false, 
      error: new Error(error.message || "Failed to sign out") 
    }
  }
}

// Reset vendor password
export const resetVendorPassword = async (email: string) => {
  try {
    const auth = getAuth()
    if (!auth) {
      return { 
        success: false, 
        error: new Error("Firebase authentication not initialized") 
      }
    }
    
    // Check if email belongs to a vendor
    const vendorsQuery = query(
      collection(db, "vendors"), 
      where("email", "==", email)
    )
    
    const querySnapshot = await getDocs(vendorsQuery)
    if (querySnapshot.empty) {
      return { 
        success: false, 
        error: new Error("No vendor account found with this email") 
      }
    }
    
    await sendPasswordResetEmail(auth, email)
    
    return { 
      success: true,
      message: "Password reset email sent. Please check your inbox." 
    }
  } catch (error: any) {
    console.error("Password reset error:", error)
    
    let errorMessage = "Failed to send password reset email."
    
    if (error.code === 'auth/invalid-email') {
      errorMessage = "Invalid email address"
    } else if (error.code === 'auth/user-not-found') {
      errorMessage = "No account found with this email"
    } else if (error.message) {
      errorMessage = error.message
    }
    
    return { 
      success: false, 
      error: new Error(errorMessage) 
    }
  }
}

// Get current vendor data
export const getCurrentVendorData = async () => {
  try {
    const auth = getAuth()
    if (!auth || !auth.currentUser) {
      return { success: false, error: new Error("No authenticated vendor") }
    }

    // For development without Firebase, return test data
    if (process.env.NODE_ENV === 'development' && auth.currentUser.uid === 'test-vendor-id') {
      return { 
        success: true, 
        vendorData: {
          id: 'test-vendor-id',
          uid: 'test-vendor-id',
          name: 'Test Vendor',
          email: 'test@example.com',
          phone: '1234567890',
          address: 'Test Address',
          pincodes: ['123456'],
          role: 'vendor',
          status: 'active',
          productsCount: 0,
          joinedDate: new Date().toISOString(),
          profileComplete: true
        } as VendorCredential
      }
    }

    const userUid = auth.currentUser.uid

    // First try direct UID
    let vendorDoc = await getDoc(doc(db, "vendors", userUid))
    
    // If not found, check for vendor with prefix pattern
    if (!vendorDoc.exists()) {
      const vendorPrefixId = `vendor_${userUid}`
      vendorDoc = await getDoc(doc(db, "vendors", vendorPrefixId))
    }
    
    // If still no vendor doc, check by email as a last resort
    if (!vendorDoc.exists()) {
      const vendorsQuery = query(
        collection(db, "vendors"), 
        where("email", "==", auth.currentUser.email),
        where("uid", "==", userUid)
      )
      
      const querySnapshot = await getDocs(vendorsQuery)
      if (!querySnapshot.empty) {
        vendorDoc = querySnapshot.docs[0]
      } else {
        return { success: false, error: new Error("No vendor account found for this user") }
      }
    }
    
    const vendorData = vendorDoc.data() as VendorCredential
    
    return { 
      success: true, 
      vendorData: {
        id: vendorDoc.id,
        ...vendorData
      } as VendorCredential
    }
  } catch (error: any) {
    console.error("Error getting current vendor data:", error)
    return { 
      success: false, 
      error: new Error(error.message || "Failed to get vendor data") 
    }
  }
} 