const mongoose = require('mongoose')

mongoose.connect(process.env.MONGO_URI)

const userSchema = mongoose.Schema({
  userName: String,
  password:String,
  age: Number,
  email: String,
  posts: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post'
  }],
  profilePic:{
    type: String,
    default: 'placeholderpic.png'
  }
})

module.exports = mongoose.model('User',userSchema)