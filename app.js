require('dotenv').config()
const express = require('express')
const userModel = require('./models/user')
const postModel = require('./models/post')
const cookieParser = require('cookie-parser')
const bcrypt = require('bcrypt')
const app = express()
const jwt = require('jsonwebtoken')
const upload = require('./util/multerConfig')
const path = require('path')
require('dotenv').config()

app.set('view engine', 'ejs')
app.use(express.json())
app.use(express.urlencoded({extended:true}))
app.use(express.static(path.join(__dirname,"public")))
app.use(cookieParser())


app.get('/', (req,res) => {
  res.render('index')
})

app.get('/profile/upload', (req,res) => {
  res.render('profileUpload')
})

app.post('/upload',isLoggedIn , upload.single('image'),async (req,res) => {
  const user = await userModel.findOne({email: req.user.email})
  user.profilePic = req.file.filename
  await user.save()
  res.redirect('/profile')
})


app.post('/register', async (req,res) => {  
  const {userName,age,password,email} = req.body
  const user = await userModel.findOne({email,userName})
   if(user) return res.status(500).send('user already registered')
    bcrypt.genSalt(10, (err,salt) => {
      bcrypt.hash(password,salt, async (err,hash) => {
      const user = await userModel.create({
          userName,email,age,password:hash
        })
        const token = jwt.sign({email:email, userId:user._id}, 'secret')
        res.cookie('token', token)
        res.send('Registration completed')

      })
  })
})

app.get('/login', (req,res) => {
  res.render('login')
})
app.post('/post',isLoggedIn, async (req,res) => {
  const {postText} = req.body
  const user = await userModel.findOne({email:req.user.email})
  
  const post = await postModel.create({
    postText,
      user: user._id,
  })
  user.posts.push(post._id)
  await user.save()
  res.redirect('/profile')
})


app.get('/profile',isLoggedIn, async (req,res) => {
  const user = await userModel.findOne({email: req.user.email})
 const post = await postModel.find().populate('user')
 console.log('user => ', user, '////', 'post => ',post)
  res.render('profile',{post,user})
})

app.get('/like/:id',isLoggedIn, async (req,res) => {
  const post = await postModel.findOne({_id: req.params.id})

  if(post.Likes.indexOf(req.user.userId) === -1){
  post.Likes.push(req.user.userId)
  }
  else{
    post.Likes.splice(post.Likes.indexOf(req.user.userId),1)
  }
  await post.save()
  res.redirect('/profile')
})



app.get('/edit/:id',isLoggedIn, async (req,res) => {
  const post = await postModel.findOne({_id: req.params.id}).populate('user')
    res.render('edit', {post} )
})

app.post('/update/:id', async (req,res) => {
    const post = await postModel.findOneAndUpdate({_id: req.params.id}, {postText: req.body.postText})
    res.redirect('/profile')
} )

app.post('/login', async (req,res) => {
  const {email,password} = req.body
  const user = await userModel.findOne({email})
  if(!user) return res.status(500).send('User not found')
  bcrypt.compare(password, user.password, (err,result) => {
    if(result) {
      const token = jwt.sign({email:email, userId:user._id}, 'secret')
      res.cookie('token', token)
      res.redirect('/profile')
    }
    else{
      res.send('Wrong password')
    }
  })

})

app.get('/logout', (req,res) => {
  res.cookie('token', '')
  res.redirect('/login')
})

function isLoggedIn(req,res,next) {
  if(req.cookies.token === '') return res.send('You are not logged in')
    else {
    const data = jwt.verify(req.cookies.token, 'secret')
    req.user = data
    }
    next()
}

app.listen(3000)