var mongoose = require('mongoose');
var router = require('express').Router();
var passport = require('passport');
var User = mongoose.model('User');
var auth = require('../auth');
mongo = require('mongodb');

router.get('/user', auth.required, function(req, res, next){
  User.findById(req.payload.id).then(function(user){
    if(!user){ return res.sendStatus(401); }

    return res.json({user: user.toAuthJSON(),
                     id : user.id,
                    status: 200});
  }).catch(next);
});

router.post('/user', auth.required, function(req, res, next){
  User.findById(req.payload.id).then(function(user){
    if(!user){ return res.sendStatus(401); }

    if(typeof req.body.user.username !== 'undefined'){
      user.username = req.body.user.username;
    }
    if(typeof req.body.user.email !== 'undefined'){
      user.email = req.body.user.email;
    }
    if(typeof req.body.user.dob !== 'undefined'){
      user.dob = req.body.user.dob;
    }
    if(typeof req.body.user.mobile_no !== 'undefined'){
      user.mobile_no = req.body.user.mobile_no;
    }
    if(typeof req.body.user.profile_image !== 'undefined'){
      user.profile_image = req.body.user.profile_image;
    }
    if(typeof req.body.user.password !== 'undefined'){
      user.password = req.body.user.password;
      user.setPassword(req.body.user.password);
    }

    return user.save().then(function(){
      return res.json({data: user.toAuthJSON(),
                       status : 200 ,
                       message : "Details Updated successfully"});
    });
  }).catch(next);
});

router.post('/login', function(req, res, next){
  if(!req.body.user.email){
    return res.status(404).json({errors: {email: "can't be blank"}});
  }

  if(!req.body.user.password){
    return res.status(404).json({errors: {password: "can't be blank"}});
  }

  passport.authenticate('local', {session: false}, function(err, user, info){
    if(err){ return next(err); }

    if(user){
      user.token = user.generateJWT();
      return res.json({data: user.toAuthJSON(),
                       status : 200 ,
                       message : "Login successfully"});
    } else {
      return res.status(200).json({ status : 404,
                                    message : "Your email and password not match"});
    }
  })(req, res, next);
});

router.post('/signup', function(req, res, next){
  var user = new User();
  user.username = req.body.user.username;
  user.email = req.body.user.email;
  user.dob = req.body.user.dob;
  user.profile_image = req.body.user.profile_image;
  user.mobile_no = req.body.user.mobile_no;
  user.password = req.body.user.password;
  user.setPassword(req.body.user.password);


  user.save().then(function(){
    return res.json({data: user.toAuthJSON(),
                    status : 200 ,
                   message : "Sign up successfully"});
  }).catch(next);
});

router.post("/getUsers", async (req, res) => {
  try {
    const pageNumber = parseInt(req.body.pageNumber) || 0;
    const limit = parseInt(req.body.limit) || 12;
    const result = {};
    const match = {}
    const sort  = {}
    const totalPosts = await User.countDocuments().exec();
    let startIndex = pageNumber * limit;
    const endIndex = (pageNumber + 1) * limit;
    result.totalPosts = totalPosts;
    if (startIndex > 0) {
      result.previous = {
        pageNumber: pageNumber - 1,
        limit: limit,
      };
    }
    if (endIndex < (await User.countDocuments().exec())) {
      result.next = {
        pageNumber: pageNumber + 1,
        limit: limit,
      };
    }

    if(req.body.search){
      match.published = req.body.search === 'true'
    }
    if(req.body.sortBy && req.body.OrderBy){
      sort[req.body.sortBy]   = req.body.OrderBy === 'desc' ? -1 : 1
     }
   
    result.data = await User.find( {
      "$or": [
          { "email" : { "$regex": req.body.search, "$options":"i"} },
          { "username" : { "$regex": req.body.search, "$options":"i"} }, 
          { "mobile_no":{ "$regex": req.body.search, "$options":"i"} }, 
      ]
  })
      .sort(sort)
      .skip(startIndex)
      .limit(limit)
      .exec();
    result.rowsPerPage = limit;
    return res.json({ message: "Posts Fetched successfully", data: result ,status : 200});
  } catch (error) {     
    return res.status(500).json({ message: "Sorry, something went wrong" , status:500});
  }
});

router.post('/delete', function (req, res ,next) {
  var user = new User();
  User.findByIdAndRemove(req.body.id).then(function(user){
    if(!user){ return res.sendStatus(401); }

    return res.json({user: user.toAuthJSON(),
                     status : 200 ,
                     message : "User removed successfully"});
  }).catch(next);
});


module.exports = router;
