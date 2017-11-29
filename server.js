const express = require('express')
const app = express();
const bodyParser = require('body-parser');
const pg = require('pg');
const spicedPg = require('spiced-pg');
const db = spicedPg(process.env.DATABASE_URL || 'postgres:Amedeo:Tafano83@localhost:5432/imageBoard');
const multer = require('multer');
const uidSafe = require('uid-safe');
const path = require('path');
const toS3 = require('./public/toS3').toS3;

app.use(express.static(`${__dirname}/public`))

app.use(bodyParser.urlencoded({
    extended:false
}))

app.use(bodyParser.json())


var diskStorage = multer.diskStorage({
    destination: function (req, file, callback) {
        callback(null, path.join(__dirname , './uploads'));
    },
    filename: function (req, file, callback) {
      uidSafe(24).then(function(uid) {
          callback(null, uid + path.extname(file.originalname));
      });
    }
});

var uploader = multer({
    storage: diskStorage,
    limits: {
        filesize: 2097152
    }
});

app.get('/images',(req,res) =>{
    var q=`SELECT *  FROM images ORDER BY created_at DESC LIMIT 12`
    db.query(q).then((result) =>{
        var imgurl = result.rows
        res.json({
            img:imgurl
        })
    })
})


app.post('/upload', uploader.single('file'),function(req, res) {
    if (req.file) {
        toS3(req.file).then(function(result){
            var q = `INSERT INTO images (filename,username,title,description) VALUES ($1,$2,$3,$4) `
            var param = [req.file.filename,req.body.username,req.body.title,req.body.description]
            db.query(q,param).then(function(result){
                console.log('param',param)
            })
            res.json({
                success: true
            })
        })
    } else {
        res.json({
            success: false
        });
    }
})


app.get('/singleImg/:imageId',(req,res) =>{
    var parsed = parseInt(req.params.imageId)
    var param = [parsed]
    var q = `SELECT * FROM images WHERE id = $1 `
    db.query(q,param).then((result) =>{
        res.json({
            image:result.rows[0],
            success:true
        })
    })
})


app.get('/comments/:imageId',(req,res)=>{
    var parsed = parseInt(req.params.imageId)
    var param = [parsed]
    var q =`SELECT * FROM comments WHERE imageId = $1 ORDER BY created_at DESC`
    db.query(q,param).then((result) => {
      for (var i=0; i<result.rows.length;i++){
        result.rows[i].created_at = new Date(result.rows[i].created_at).toLocaleString()
      }
        res.json({
            comments:result.rows,
            success:true
        })
    })
})

app.post('/comments/:imageId',(req,res) =>{
    var q = `INSERT INTO comments (username,comment_text,imageId) VALUES ($1,$2,$3)`
    var param = [req.body.username,req.body.comment,req.params.imageId]
    db.query(q,param).then(function(result){
        res.json({
            success: true
        })

    }).catch(function(e){
        console.log(e)
        res.json({
            success:false
        })
    })
})



app.listen(8080,  () =>{
    console.log('Listening on port 8080')
})
