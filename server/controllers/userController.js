const User = require("../models/User");

// Add new user
exports.addUser = async (req, res) => {
	try {
		const {
			userType,
			fullName,
			email,
			password,
			phone,
			address,
			governorate,
			city,
			storeName,
		} = req.body;

		if (!userType || !fullName || !email || !password || !phone)
			return res
				.status(400)
				.json({ message: "Required fields are missing" });

		const isStrongPassword = (password) => {
			const regex =
				/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
			return regex.test(password);
		};

		if (!isStrongPassword(password)) {
			return res.status(400).json({
				message:
					"Weak password. Must contain 8+ chars, uppercase, lowercase, number, and special character.",
			});
		}

		const existingUser = await User.findOne({
			$or: [{ email }, { fullName }],
		});
		if (existingUser)
			return res
				.status(400)
				.json({ message: "Full name or email already exists" });

		const newUser = new User({
			userType,
			fullName,
			email,
			password,
			phone,
			address,
			governorate,
			city,
			storeName,
		});

		await newUser.save();
		res.status(201).json({
			message: "User added successfully",
			user: newUser,
		});
	} catch (error) {
		res.status(500).json({ message: "Server error" });
	}
};

// Get all users
exports.getUsers = async (req, res) => {
	try {
		const users = await User.find().select("-password"); // hide password
		res.status(200).json(users);
	} catch (error) {
		res.status(500).json({ message: "Error fetching users" });
	}
};

// Update user
exports.updateUser = async (req, res) => {
	try {
		const { id } = req.params;
		const updates = req.body;

		// Prevent updating email or fullName to duplicates
		if (updates.email) {
			const existingEmail = await User.findOne({
				email: updates.email,
				_id: { $ne: id },
			});
			if (existingEmail)
				return res
					.status(400)
					.json({ message: "Email already in use" });
		}

		if (updates.fullName) {
			const existingName = await User.findOne({
				fullName: updates.fullName,
				_id: { $ne: id },
			});
			if (existingName)
				return res
					.status(400)
					.json({ message: "Full name already in use" });
		}

		const updatedUser = await User.findByIdAndUpdate(id, updates, {
			new: true,
			runValidators: true,
		}).select("-password");

		if (!updatedUser)
			return res.status(404).json({ message: "User not found" });

		res.status(200).json({
			message: "User updated successfully",
			updatedUser,
		});
	} catch (error) {
		res.status(500).json({ message: "Error updating user" });
	}
};

// Delete user
exports.deleteUser = async (req, res) => {
	try {
		const { id } = req.params;
		const deletedUser = await User.findByIdAndDelete(id);

		if (!deletedUser)
			return res.status(404).json({ message: "User not found" });

		res.status(200).json({ message: "User deleted successfully" });
	} catch (error) {
		res.status(500).json({ message: "Error deleting user" });
	}
};
