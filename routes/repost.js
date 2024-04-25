const verifyToken = require("../middlewares/verifyToken");
const Repost = require("../model/repost");
const router = require("express").Router();

router.post("/:id", verifyToken, (req, res) => {
    const {id} = req.params

    const repost = new Repost({
        content : id,
        user : req.user,
        date : new Date()
    })
    
    repost.save()
    .then(()=>{res.json({success:"Repost successful"})})
    .catch((err)=>{
        res.json({error:"Something went wrong"})
        console.log(err);
    })
});

router.get("/fetch/all", (req,res) => {
    Repost.find().populate("content user")
    .then((data)=>{res.json(data)})
    .catch((err)=>{
        res.json({error:"something wrong"})
        console.log(err);
    })
})

router.post("/delete/:id", verifyToken, (req, res) => {
    const { id } = req.params;
    const userId = req.user;

    Repost.findOneAndDelete({ _id: id, user: userId })
        .then(deletedRepost => {
            if (!deletedRepost) {
                return res.status(404).json({ error: 'Repost not found or unauthorized' });
            }
            res.json({ success: 'Repost deleted successfully'});
        })
        .catch(err => {
            console.log( err);
            res.status(500).json({ error: 'Something went wrong' });
        });
});


module.exports = router;