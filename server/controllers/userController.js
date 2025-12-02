const User = require("../models/User");
const bcrypt = require('bcryptjs');
const { paginate } = require("../utils/pagination");

const allowedFields = [
	"userType",
	"fullName",
	"email",
	"password",
	"phone",
	"address",
	"governorate",
	"city",
	"storeName",
	"assignedCities",
	"pickupCost",
	"rejectionFeePercentage",
];
//  Get user profile
exports.getUserProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password'); // لا ترسل كلمة المرور

        if (user) {
            res.json({
                id: user._id,
                fullName: user.fullName, 
                email: user.email,
                userType: user.userType,
            });
        } else {
            res.status(404).json({ message: 'المستخدم غير موجود' });
        }
    } catch (error) {
        res.status(500).json({ message: 'خطأ في الخادم' });
    }
};
//     update password
exports.updatePassword = async (req, res) => {
    const { currentPassword, newPassword } = req.body;

    try {
        const user = await User.findById(req.user.id).select('+password'); // جلب كلمة المرور للمقارنة
       // [تعديل 1] التحقق الأكيد من وجود كلمة المرور المشفرة
        if (!user || !user.password) {
            return res.status(404).json({ message: 'لم يتم العثور على ملف المستخدم أو حقل كلمة المرور مفقود.' });
        }
        
        if (!currentPassword) {
            return res.status(401).json({ message: 'لا يمكن أن يكون حقل كلمة المرور الحالية فارغًا.' });
        }

        if (!newPassword) {
            return res.status(401).json({ message: 'لا يمكن أن يكون حقل كلمة المرور الجديدة فارغًا.' });
        }

        // 3. المقارنة والمصادقة
        if (await bcrypt.compare(currentPassword, user.password)) {
            
            // 4. تشفير كلمة المرور الجديدة
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(newPassword, salt);
            
            // 4. استخدام FindByIdAndUpdate لتجاوز قواعد التحقق غير الضرورية
            await User.findByIdAndUpdate(
                req.user.id, // ID
                { password: hashedPassword }, // الحقل المراد تحديثه فقط
                { 
                    new: true, 
                    runValidators:  false // لا يزال يشغل قواعد التحقق على الحقل المُعدَّل فقط (password)
                }
            );

            res.json({ message: 'تم تحديث كلمة المرور بنجاح' });
        } else {
            res.status(401).json({ message: '!كلمة المرور الحالية غير صحيحة' });
        }
    } catch (error) {
        // إذا كان الخطأ هنا، فهو خطأ تشفير أو خطأ في الاتصال بالـ DB
        console.error("PUT /api/users/password failed:", error); 
        res.status(500).json({ message: 'خطأ في معالجة تحديث كلمة المرور' });
    }
};
// Add new user
exports.addUser = async (req, res) => {
	try {
		// const {
		// 	userType,
		// 	fullName,
		// 	email,
		// 	password,
		// 	phone,
		// 	address,
		// 	governorate,
		// 	city,
		// 	storeName,
		// } = req.body;
		const userData = Object.fromEntries(
			allowedFields.map((key) => [key, req.body[key]])
		);

		if (
			!userData.userType ||
			!userData.fullName ||
			!userData.email ||
			!userData.password ||
			!userData.phone
		)
			return res
				.status(400)
				.json({ message: "الحقول المطلوبة ناقصة" });

		const isStrongPassword = (password) => {
			const regex =
				/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
			return regex.test(password);
		};

		if (!isStrongPassword(userData.password)) {
			return res.status(400).json({
				message:
					"كلمة المرور ضعيفة. يجب أن تحتوي على 8 أحرف على الأقل، أحرف كبيرة وصغيرة، أرقام، ورموز خاصة",
			});
		}

		const existingUser = await User.findOne({
			$or: [{ email: userData.email }, { fullName: userData.fullName }],
		});
		if (existingUser)
			return res
				.status(400)
				.json({ message: "الاسم الكامل أو البريد الإلكتروني موجود بالفعل" });

		const newUser = new User(userData);

		await newUser.save();
		res.status(201).json({
			message: "تم إضافة المستخدم بنجاح",
			user: newUser,
		});
	} catch (error) {
		res.status(500).json({ message: "خطأ في الخادم" });
	}
};

// Get all users (paginated with optional search)
exports.getUsers = async (req, res) => {
	try {
		const { page, limit, q } = req.query;
		let filter = {};
		
		// If search query exists, add search filter
		if (q && q.trim()) {
			filter = {
				$or: [
					{ fullName: new RegExp(q, "i") },
					{ email: new RegExp(q, "i") },
					{ phone: new RegExp(q, "i") },
				],
			};
		}
		
		const { data: users, meta } = await paginate(User, filter, { page, limit, select: '-password', sort: { createdAt: -1 } });
		res.status(200).json({ status: 'success', results: users.length, meta, data: { users } });
	} catch (error) {
		res.status(500).json({ message: "خطأ في جلب المستخدمين" });
	}
};

// Get users with search
exports.getUsersWithSearch = async (req, res) => {
	try {
		const { q, page, limit } = req.query;
		const filter = {
			$or: [
				{ fullName: new RegExp(q, "i") },
				{ email: new RegExp(q, "i") },
			],
		};
		const { data: users, meta } = await paginate(User, filter, { page, limit, select: '-password', sort: { createdAt: -1 } });
		res.status(200).json({ status: 'success', results: users.length, meta, data: { users } });
	} catch (error) {
		res.status(500).json({ message: "المستخدم غير موجود" });
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
					.json({ message: "الاسم الكامل مستخدم بالفعل" });
		}

		const updatedUser = await User.findByIdAndUpdate(id, updates, {
			new: true,
			runValidators: true,
		}).select("-password");

		if (!updatedUser)
			return res.status(404).json({ message: "المستخدم غير موجود" });

		res.status(200).json({
			message: "تم تحديث المستخدم بنجاح",
			updatedUser,
		});
	} catch (error) {
		res.status(500).json({ message: "خطأ في تحديث المستخدم" });
	}
};

// Delete user
exports.deleteUser = async (req, res) => {
	try {
		const { id } = req.params;
		const deletedUser = await User.findByIdAndDelete(id);

		if (!deletedUser)
			return res.status(404).json({ message: "المستخدم غير موجود" });

		res.status(200).json({ message: "تم حذف المستخدم بنجاح" });
	} catch (error) {
		res.status(500).json({ message: "خطأ في حذف المستخدم" });
	}
};

exports.searchMerchants = async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q) {
      return res.status(200).json({ status: 'success', data: [] });
    }

    const merchants = await User.find({
      userType: "merchant", 
      $or: [
        { fullName: new RegExp(q, "i") },
        { storeName: new RegExp(q, "i") }, 
        { phone: new RegExp(q, "i") }     
      ],
    }).select("fullName storeName phone email _id").limit(10); 

    res.status(200).json({
      status: "success",
      results: merchants.length,
      data: merchants,
    });
  } catch (error) {
    console.error("Search Merchant Error:", error);
    res.status(500).json({ message: "خطأ في البحث عن التجار" });
  }
};