const express = require("express");
const bodyParser = require("body-parser");
const { nanoid } = require('nanoid')
require("dotenv").config();
const mongoose = require("mongoose");

const app = express();

app.set('view engine', 'ejs');
app.use(express.static(__dirname + '/public'));
app.use(bodyParser.urlencoded({ extended: true }));

mongoose.connect(process.env.MONGO_URL, {
    useUnifiedTopology: true,
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
});

const linkSchema = new mongoose.Schema({
    identifier: {
        required: true,
        type: String,
    },
    url: {
        required: true,
        type: String,
    },
    clicks: {
        required: true,
        type: Number,
        default: 0,
    }
});

const Link = mongoose.model("Link", linkSchema);

app.get('/', async(req, res) => {
    const links = await Link.find()
    res.render('index', { links: links })
});

app.post('/shorten', async(req, res) => {
    if (req.body.PW == process.env.PW){
        let id = null
        while (1) {
            id = nanoid(7)
            if (await Link.exists({ identifier: id })) continue;
            else break;
        }
    
        let url = req.body.URL
        if (!(url.startsWith('https://') || url.startsWith('http://'))) {
            url = 'http://' + url
        }
    
        await Link.create({
            identifier: id,
            url: url,
            clicks: 0
        })
    
        res.redirect('/')
    }else{
        res.send(`<div style="display: flex; justify-content: center;">
        <h1>Wrong Password</h1>
      </div> `)
    }
});

app.post('/delete', (req, res) => {
    if (req.body.PW == process.env.PW) {
        Link.findOneAndRemove({ identifier: req.body.ID }, (err, deleted) => {
            if (err) {
                console.log(err)
            } else {
                console.log(deleted)
            }
        })
        res.redirect('/')
    }else{
        res.send(`<div style="display: flex; justify-content: center;">
        <h1>Wrong Password</h1>
      </div> `)
    }
})

app.get('/:url', (req, res) => {
    Link.findOne({ identifier: req.params.url }).then( (link) => {
        if (link === undefined) {
            res.send(`<div style="display: flex; justify-content: center;">
            <h1>Link Not Found</h1>
          </div> `)
        }else{
            link.clicks++;
            link.save()

            res.redirect(link.url)
        }
    })
})

app.listen(process.env.PORT || 3000);
