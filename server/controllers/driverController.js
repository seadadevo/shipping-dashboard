const User = require('../models/User');
const Order = require('../models/Order');

// Get all drivers 
exports.getAllDrivers = async (req, res) => {
	try {
		const drivers = await User.find({ userType: 'courier' })
			.select('fullName phoneNumber email assignedCities isAvailable')
			.sort({ fullName: 1 });

		res.status(200).json({
			success: true,
			count: drivers.length,
			data: drivers
		});
	} catch (error) {
		console.error('Error fetching drivers:', error);
		res.status(500).json({
			success: false,
			message: 'خطأ في جلب السائقين',
			error: error.message
		});
	}
};


exports.assignCitiesToDriver = async (req, res) => {
	try {
		const { id } = req.params;
		const { cities } = req.body; 

		
		const driver = await User.findById(id);
		if (!driver) {
			return res.status(404).json({
				success: false,
				message: 'Driver not found'
			});
		}

		if (driver.userType !== 'courier') {
			return res.status(400).json({
				success: false,
				message: 'User is not a courier/driver'
			});
		}

		// Update assigned cities
		driver.assignedCities = cities;
		await driver.save();

		res.status(200).json({
			success: true,
			message: 'تم تعيين المدن بنجاح',
			data: driver
		});
	} catch (error) {
		console.error('Error assigning cities:', error);
		res.status(500).json({
			success: false,
			message: 'خطأ في تعيين المدن للسائق',
			error: error.message
		});
	}
};


exports.getDriversByCity = async (req, res) => {
	try {
		const { governorate, city } = req.query;

		if (!governorate || !city) {
			return res.status(400).json({
				success: false,
				message: 'المحافظة والمدينة مطلوبان'
			});
		}

		const drivers = await User.find({
			userType: 'courier',
			isAvailable: true,
			assignedCities: {
				$elemMatch: {
					governorate: governorate,
					city: city
				}
			}
		}).select('fullName phoneNumber assignedCities');

		res.status(200).json({
			success: true,
			count: drivers.length,
			data: drivers
		});
	} catch (error) {
		console.error('Error fetching drivers by city:', error);
		res.status(500).json({
			success: false,
			message: 'خطأ في جلب السائقين المتاحين',
			error: error.message
		});
	}
};


exports.getDriverDeliveries = async (req, res) => {
	try {
		const driverId = req.user.id;
		const { status, page = 1, limit = 10, q } = req.query;

		
		let query = { assignedDriver: driverId };
		if (status && status !== 'all') {
			
			const statusArray = status.split(',');
			query.status = statusArray.length > 1 ? { $in: statusArray } : status;
		}

		// Add search functionality
		if (q && q.trim()) {
			const searchRegex = new RegExp(q.trim(), 'i');
			query.$or = [
				{ customerName: searchRegex },
				{ customerPhone1: searchRegex },
				{ customerPhone2: searchRegex },
				{ customerEmail: searchRegex }
			];
		}

		// Pagination
		const skip = (page - 1) * limit;
		const total = await Order.countDocuments(query);

		const orders = await Order.find(query)
			.populate('createdBy', 'fullName storeName')
			.sort({ createdAt: -1 })
			.skip(skip)
			.limit(parseInt(limit));

		res.status(200).json({
			success: true,
			meta: {
				total,
				page: parseInt(page),
				limit: parseInt(limit),
				totalPages: Math.ceil(total / limit)
			},
			data: orders
		});
	} catch (error) {
		console.error('Error fetching deliveries:', error);
		res.status(500).json({
			success: false,
			message: 'خطأ في جلب عمليات التوصيل',
			error: error.message
		});
	}
};

// Update driver status for an order
exports.updateDriverStatus = async (req, res) => {
	try {
		const { id } = req.params;
		const { driverStatus } = req.body;
		const driverId = req.user.id;

		const order = await Order.findOne({ _id: id, assignedDriver: driverId });
		
		if (!order) {
			return res.status(404).json({
				success: false,
				message: 'الطلب غير موجود أو غير مخصص لك'
			});
		}

		order.driverStatus = driverStatus;
		
		// If delivered, also update main status
		if (driverStatus === 'delivered') {
			order.status = 'Delivered';
		} else if (driverStatus === 'in-transit') {
			order.status = 'Shipped';
		}

		await order.save();

		res.status(200).json({
			success: true,
			message: 'تم تحديث الحالة بنجاح',
			data: order
		});
	} catch (error) {
		console.error('Error updating driver status:', error);
		res.status(500).json({
			success: false,
			message: 'خطأ في تحديث الحالة',
			error: error.message
		});
	}
};

// Toggle driver availability
exports.updateDriverAvailability = async (req, res) => {
	try {
		const { id } = req.params;
		const { isAvailable } = req.body;

		// Validate driver exists
		const driver = await User.findById(id);
		if (!driver) {
			return res.status(404).json({
				success: false,
				message: 'السائق غير موجود'
			});
		}

		if (driver.userType !== 'courier') {
			return res.status(400).json({
				success: false,
				message: 'المستخدم ليس سائقًا'
			});
		}

		// Update availability
		driver.isAvailable = isAvailable;
		await driver.save();

		res.status(200).json({
			success: true,
			message: `تم ${isAvailable ? 'تفعيل' : 'إلغاء تفعيل'} توفر السائق`,
			data: driver
		});
	} catch (error) {
		console.error('Error updating driver availability:', error);
		res.status(500).json({
			success: false,
			message: 'خطأ في تحديث توفر السائق',
			error: error.message
		});
	}
};

// Get driver statistics
exports.getDriverStats = async (req, res) => {
	try {
		const driverId = req.user.id;
		
		const today = new Date();
		today.setHours(0, 0, 0, 0);
		
		const weekAgo = new Date();
		weekAgo.setDate(weekAgo.getDate() - 7);
		weekAgo.setHours(0, 0, 0, 0);

		// Today's deliveries
		const todayDeliveries = await Order.countDocuments({
			assignedDriver: driverId,
			driverStatus: 'delivered',
			updatedAt: { $gte: today }
		});

		// This week's deliveries
		const weekDeliveries = await Order.countDocuments({
			assignedDriver: driverId,
			driverStatus: 'delivered',
			updatedAt: { $gte: weekAgo }
		});

		// Total delivered
		const totalDelivered = await Order.countDocuments({
			assignedDriver: driverId,
			driverStatus: 'delivered'
		});

		// Pending deliveries
		const pendingDeliveries = await Order.countDocuments({
			assignedDriver: driverId,
			driverStatus: { $in: ['pending', 'picked-up', 'in-transit'] }
		});

		res.status(200).json({
			success: true,
			data: {
				todayDeliveries,
				weekDeliveries,
				totalDelivered,
				pendingDeliveries
			}
		});
	} catch (error) {
		console.error('Error fetching driver stats:', error);
		res.status(500).json({
			success: false,
			message: 'خطأ في جلب الإحصائيات',
			error: error.message
		});
	}
};
