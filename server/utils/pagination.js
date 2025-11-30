/**
 * Simple pagination helper for Mongoose models.
 * Usage:
 *   const { data, meta } = await paginate(Model, filter, { page, limit, populate, select, sort })
 */
async function paginate(Model, filter = {}, options = {}) {
  const page = Math.max(parseInt(options.page, 10) || 1, 1);
  const limit = Math.max(parseInt(options.limit, 10) || 10, 1);
  const skip = (page - 1) * limit;

  const total = await Model.countDocuments(filter);

  let query = Model.find(filter);
  if (options.select) query = query.select(options.select);
  if (options.populate) query = query.populate(options.populate);
  if (options.sort) query = query.sort(options.sort);
  query = query.skip(skip).limit(limit);

  const data = await query.exec();

  const totalPages = limit > 0 ? Math.ceil(total / limit) : 0;

  const meta = {
    total,
    page,
    limit,
    totalPages,
  };

  return { data, meta };
}

module.exports = { paginate };
