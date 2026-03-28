const mongoose = require('mongoose')
require('dotenv').config()
const User = require('./models/User')

mongoose.connect(process.env.DB_URL, {
  useNewUrlParser: true, 
  useUnifiedTopology: true,
  useCreateIndex: true,
}).then(async () => {
    try {
        const admin = await User.findOneAndUpdate({ email: 'admin@gmail.com' }, { isVerified: true }, { new: true })
        console.log("Admin verified:", admin.isVerified)
        // Also verify the customer account while we're at it
        const customer = await User.findOneAndUpdate({ email: 'customer@gmail.com' }, { isVerified: true }, { new: true })
        if (customer) console.log("Customer verified:", customer.isVerified)
    } catch (e) {
        console.log("Error:", e)
    } finally {
        mongoose.connection.close()
    }
})
