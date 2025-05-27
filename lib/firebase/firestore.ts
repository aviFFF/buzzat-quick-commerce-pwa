import { db } from "./config"
import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  type Timestamp,
  limit,
} from "firebase/firestore"

// Types
export interface Product {
  id?: string
  name: string
  description: string
  price: number
  mrp: number
  category: string
  image: string
  imagePath?: string
  imagePublicId?: string
  additionalImages?: Array<{
    url: string;
    path?: string;
    public_id?: string;
  }>
  unit: string
  stock: number
  vendorId: string
  pincodes: string[]
  status: "active" | "out_of_stock" | "deleted"
  createdAt?: Timestamp
  updatedAt?: Timestamp
}

export interface Vendor {
  id?: string
  name: string
  email: string
  phone: string
  address: string
  pincodes: string[]
  status: "active" | "pending" | "blocked"
  deliveryMessage?: string
  createdAt?: Timestamp
  updatedAt?: Timestamp
}

export interface Order {
  id?: string
  userId: string
  items: Array<{
    productId: string
    name: string
    price: number
    quantity: number
  }>
  totalAmount: number
  deliveryFee: number
  address: {
    name: string
    phone: string
    address: string
    pincode: string
    city: string
  }
  paymentMethod: "cod" | "online"
  paymentStatus: "pending" | "paid" | "failed"
  orderStatus: "pending" | "confirmed" | "preparing" | "ready" | "out_for_delivery" | "delivered" | "cancelled"
  deliveryPersonId?: string
  createdAt?: Timestamp
  updatedAt?: Timestamp
}

// Products
export const getProductsByPincode = async (pincode: string) => {
  try {
    console.log(`Fetching products for pincode: ${pincode}`);
    const q = query(
      collection(db, "products"),
      where("pincodes", "array-contains", pincode),
      where("status", "==", "active"),
    )
    const querySnapshot = await getDocs(q)
    const products = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Product[]
    
    console.log(`Found ${products.length} products for pincode ${pincode}`);
    if (products.length > 0) {
      console.log(`Sample product categories: ${products.slice(0, 3).map(p => p.category).join(', ')}`);
      console.log(`Sample product: ${JSON.stringify(products[0], null, 2)}`);
    }
    
    return products;
  } catch (error) {
    console.error("Error getting products by pincode:", error)
    return []
  }
}

// Check if a pincode is serviceable (has any products available)
export const isPincodeServiceable = async (pincode: string): Promise<boolean> => {
  try {
    console.log(`Checking if pincode ${pincode} is serviceable`);
    const q = query(
      collection(db, "products"),
      where("pincodes", "array-contains", pincode),
      where("status", "==", "active"),
      // Limit to 1 since we only need to know if any products exist
      limit(1)
    )
    const querySnapshot = await getDocs(q)
    const isServiceable = !querySnapshot.empty
    console.log(`Pincode ${pincode} serviceable: ${isServiceable}`);
    return isServiceable;
  } catch (error) {
    console.error("Error checking pincode serviceability:", error)
    // Default to false if there's an error
    return false
  }
}

// Get all unique categories that have products for a specific pincode
export const getCategoriesByPincode = async (pincode: string) => {
  try {
    console.log(`Fetching categories for pincode: ${pincode}`);
    const products = await getProductsByPincode(pincode);
    
    // Extract unique categories
    const categorySet = new Set<string>();
    products.forEach(product => {
      if (product.category) {
        categorySet.add(product.category);
      }
    });
    
    const categories = Array.from(categorySet);
    console.log(`Found ${categories.length} unique categories for pincode ${pincode}: ${categories.join(', ')}`);
    
    return categories;
  } catch (error) {
    console.error("Error getting categories by pincode:", error);
    return [];
  }
}

// Get all categories from the categories collection
export const getAllCategories = async () => {
  try {
    const q = query(collection(db, "categories"), orderBy("name"));
    const querySnapshot = await getDocs(q);
    
    const categories = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    
    console.log(`Found ${categories.length} categories in the database`);
    
    return categories;
  } catch (error) {
    console.error("Error getting all categories:", error);
    return [];
  }
}

export const getProductsByCategory = async (category: string, pincode: string) => {
  try {
    const q = query(
      collection(db, "products"),
      where("category", "==", category),
      where("pincodes", "array-contains", pincode),
      where("status", "==", "active"),
    )
    const querySnapshot = await getDocs(q)
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Product[]
  } catch (error) {
    console.error("Error getting products by category:", error)
    return []
  }
}

export const getProductById = async (productId: string) => {
  try {
    const docRef = doc(db, "products", productId)
    const docSnap = await getDoc(docRef)
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as Product
    } else {
      return null
    }
  } catch (error) {
    console.error("Error getting product by ID:", error)
    return null
  }
}

export const addProduct = async (product: Omit<Product, "id" | "createdAt" | "updatedAt">) => {
  try {
    // Validate required fields
    const requiredFields = ["name", "description", "price", "mrp", "category", "image", "unit", "vendorId", "pincodes"];
    for (const field of requiredFields) {
      if (!product[field as keyof typeof product]) {
        throw new Error(`Missing required field: ${field}`);
      }
    }

    // Ensure pincodes is an array
    if (!Array.isArray(product.pincodes) || product.pincodes.length === 0) {
      throw new Error("Product must have at least one pincode for delivery area");
    }

    // Add the document to Firestore
    const docRef = await addDoc(collection(db, "products"), {
      ...product,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    console.log("Product added successfully with ID:", docRef.id);

    return { id: docRef.id, ...product };
  } catch (error) {
    console.error("Error adding product:", error);
    throw error;
  }
}

export const updateProduct = async (
  productId: string,
  product: Partial<Omit<Product, "id" | "createdAt" | "updatedAt">>,
) => {
  try {
    const docRef = doc(db, "products", productId)
    await updateDoc(docRef, {
      ...product,
      updatedAt: serverTimestamp(),
    })
    return { id: productId, ...product }
  } catch (error) {
    console.error("Error updating product:", error)
    throw error
  }
}

export const deleteProduct = async (productId: string) => {
  try {
    // Soft delete by updating status
    const docRef = doc(db, "products", productId)
    await updateDoc(docRef, {
      status: "deleted",
      updatedAt: serverTimestamp(),
    })
    return { success: true }
  } catch (error) {
    console.error("Error deleting product:", error)
    throw error
  }
}

// Vendors
export const getVendorsByPincode = async (pincode: string) => {
  try {
    const q = query(
      collection(db, "vendors"),
      where("pincodes", "array-contains", pincode),
      where("status", "==", "active"),
    )
    const querySnapshot = await getDocs(q)
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Vendor[]
  } catch (error) {
    console.error("Error getting vendors by pincode:", error)
    return []
  }
}

export const getVendorById = async (vendorId: string) => {
  try {
    const docRef = doc(db, "vendors", vendorId)
    const docSnap = await getDoc(docRef)
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as Vendor
    } else {
      return null
    }
  } catch (error) {
    console.error("Error getting vendor by ID:", error)
    return null
  }
}

export const addVendor = async (vendor: Omit<Vendor, "id" | "createdAt" | "updatedAt">) => {
  try {
    const docRef = await addDoc(collection(db, "vendors"), {
      ...vendor,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
    return { id: docRef.id, ...vendor }
  } catch (error) {
    console.error("Error adding vendor:", error)
    throw error
  }
}

export const updateVendor = async (
  vendorId: string,
  vendor: Partial<Omit<Vendor, "id" | "createdAt" | "updatedAt">>,
) => {
  try {
    const docRef = doc(db, "vendors", vendorId)
    await updateDoc(docRef, {
      ...vendor,
      updatedAt: serverTimestamp(),
    })
    return { id: vendorId, ...vendor }
  } catch (error) {
    console.error("Error updating vendor:", error)
    throw error
  }
}

// Orders
export const createOrder = async (orderData: Omit<Order, "id" | "createdAt" | "updatedAt">) => {
  try {
    const docRef = await addDoc(collection(db, "orders"), {
      ...orderData,
      orderStatus: "pending",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
    return { id: docRef.id, ...orderData }
  } catch (error) {
    console.error("Error creating order:", error)
    throw error
  }
}

export const getOrdersByUser = async (userId: string) => {
  try {
    const q = query(collection(db, "orders"), where("userId", "==", userId), orderBy("createdAt", "desc"))
    const querySnapshot = await getDocs(q)
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Order[]
  } catch (error) {
    console.error("Error getting orders by user:", error)
    return []
  }
}

export const getOrderById = async (orderId: string) => {
  try {
    const docRef = doc(db, "orders", orderId)
    const docSnap = await getDoc(docRef)
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as Order
    } else {
      return null
    }
  } catch (error) {
    console.error("Error getting order by ID:", error)
    return null
  }
}

export const updateOrderStatus = async (orderId: string, status: Order["orderStatus"]) => {
  try {
    const docRef = doc(db, "orders", orderId)
    await updateDoc(docRef, {
      orderStatus: status,
      updatedAt: serverTimestamp(),
    })
    return { success: true }
  } catch (error) {
    console.error("Error updating order status:", error)
    throw error
  }
}

export const assignDeliveryPerson = async (orderId: string, deliveryPersonId: string) => {
  try {
    const docRef = doc(db, "orders", orderId)
    await updateDoc(docRef, {
      deliveryPersonId,
      orderStatus: "out_for_delivery",
      updatedAt: serverTimestamp(),
    })
    return { success: true }
  } catch (error) {
    console.error("Error assigning delivery person:", error)
    throw error
  }
}
