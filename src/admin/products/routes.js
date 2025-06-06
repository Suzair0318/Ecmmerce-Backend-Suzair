const express = require("express");

const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const productController = require("./controllers/product_controller");

const uploadDir = "uploads/";

// Only create uploads folder if NOT running on Vercel
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// Multer config for file uploads
const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, uploadDir); // Make sure this folder exists or handle dynamically
  },
  filename(req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB per file
});

// CRUD Product Routes
router.post("/create", upload.array("images"), productController.createProduct);
router.get("/", productController.getAllProducts); 
router.get("/:id", productController.getProductById); 
router.put("/:id", upload.array("images"), productController.updateProduct);
router.delete("/:id", productController.deleteProduct);

// Search products by query (name, category, etc)
router.post("/search", productController.searchProducts);

module.exports = router;
