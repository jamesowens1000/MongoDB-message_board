var bodyParser = require('body-parser');
var express = require('express');
var mongoose = require('mongoose');
var path = require('path');
var flash = require('express-flash');
var session = require('express-session');

var app = express();
app.use(flash());
app.use(session({
    secret: 'keyboard',
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 60000 }
}))
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static(path.join(__dirname, './static')));
app.set('views', path.join(__dirname, './views'));
app.set('view engine', 'ejs');

mongoose.connect('mongodb://localhost/message_board', {useNewUrlParser:true});

const CmntSchema = new mongoose.Schema({
    c_name: {type: String, required: [true, "Comments must have an author name"]},
    c_text: {type: String, required: [true, "Comments must have content"]},
}, {timestamps: true})
const MssgSchema = new mongoose.Schema({
    m_name: {type: String, required: [true, "Messages must have an author name"]},
    m_text: {type: String, required: [true, "Messages must have content"]},
    cmnts: [CmntSchema]
}, {timestamps: true})

var Cmnt = mongoose.model('Comment', CmntSchema);
var Mssg = mongoose.model('Message', MssgSchema);


app.get('/', function(req,res) {
    Mssg.find({}, function(err,mssgs){
        if(err) {
            console.log('Error retrieving Messages');
        } else {
            console.log('Successfully retrieved Messages');
            res.render('index', {mssgs: mssgs});
        }
    })
})

app.post('/post_message', function(req,res){
    var new_msg = new Mssg({m_name: req.body.m_name, m_text: req.body.m_text});

    new_msg.save(function(err) {
        if(err) {
            console.log('Error adding a Message');
            for(var key in err.errors){
                req.flash('invalid_msg', err.errors[key].message);
            }
        } else {
            console.log('Successfully added a Message');
        }
        res.redirect('/');
    })
})

app.post('/post_comment/:m_id', function(req,res){
    Cmnt.create(req.body, function(err, data){
        if(err){
            console.log('Error adding a Comment');
            for(var key in err.errors){
                req.flash('invalid_cmnt', err.errors[key].message);
            }
        } else {
            Mssg.findOneAndUpdate({_id: req.params.m_id}, {$push: {cmnts: data}}, function(err, data){
                if(err){
                    console.log('Error updating a Message');
               }
               else {
                console.log('Successfully updated a Message');
               }
            })
        }
        res.redirect('/');
    })
})

app.listen(8000, function() {
    console.log("listening on port 8000");
})