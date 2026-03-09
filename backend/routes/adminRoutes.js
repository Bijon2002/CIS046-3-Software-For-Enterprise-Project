const router = require("express").Router();
const auth = require("../middleware/authMiddleware");
const { adminOnly, getDashboard, getAllUsers, deleteUser, updateUserRole } = require("../controllers/adminController");

router.use(auth, adminOnly); // all admin routes require auth + admin role

router.get("/dashboard", getDashboard);
router.get("/users", getAllUsers);
router.delete("/users/:userId", deleteUser);
router.patch("/users/:userId/role", updateUserRole);

module.exports = router;
