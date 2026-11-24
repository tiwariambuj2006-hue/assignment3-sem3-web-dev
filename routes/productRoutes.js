const express=require('express');
const mongoose=require('mongoose');
const Product=require('../models/product');
const validateProduct=require('../middleware/validateProduct');
const router=express.Router();

router.post('/',validateProduct,(req,res,next)=>{
  Product.create(req.body)
    .then(product=>res.status(201).json(product))
    .catch(next);
});

router.get('/low-stock',(req,res,next)=>{
  Product.find({$expr:{$lte:['$quantity','$reorderLevel']}})
    .sort({quantity:1,name:1})
    .then(lowStockItems=>res.json({count:lowStockItems.length,lowStockItems}))
    .catch(next);
});

router.get('/summary',(req,res,next)=>{
  Product.aggregate([
    {$group:{
      _id:'$category',
      totalItems:{$sum:1},
      totalQuantity:{$sum:'$quantity'},
      totalStockValue:{$sum:{$multiply:['$price','$quantity']}},
      avgPrice:{$avg:'$price'}
    }},
    {$sort:{_id:1}}
  ])
    .then(summary=>res.json({categories:summary.length,summary}))
    .catch(next);
});

router.get('/',(req,res,next)=>{
  const page=Math.max(parseInt(req.query.page,10)||1,1);
  const limit=Math.min(Math.max(parseInt(req.query.limit,10)||10,1),100);
  const filter={};

  if(req.query.category)filter.category=new RegExp(`^${escapeRegex(req.query.category)}$`,'i');
  if(req.query.search){
    const search=new RegExp(escapeRegex(req.query.search),'i');
    filter.$or=[{name:search},{sku:search},{category:search},{supplier:search}];
  }
  if(req.query.minPrice!==undefined||req.query.maxPrice!==undefined){
    filter.price={};
    if(req.query.minPrice!==undefined)filter.price.$gte=Number(req.query.minPrice);
    if(req.query.maxPrice!==undefined)filter.price.$lte=Number(req.query.maxPrice);
    if(Object.values(filter.price).some(value=>!Number.isFinite(value))){
      return res.status(400).json({message:'minPrice and maxPrice must be valid numbers'});
    }
  }
  if(req.query.lowStock==='true')filter.$expr={$lte:['$quantity','$reorderLevel']};

  const allowedSortFields=['name','sku','category','price','quantity','createdAt','updatedAt'];
  const sortBy=allowedSortFields.includes(req.query.sortBy)?req.query.sortBy:'createdAt';
  const sortOrder=req.query.order==='asc'?1:-1;

  Promise.all([
    Product.find(filter).sort({[sortBy]:sortOrder}).skip((page-1)*limit).limit(limit),
    Product.countDocuments(filter)
  ])
    .then(([products,total])=>res.json({
      total,
      page,
      limit,
      totalPages:Math.ceil(total/limit),
      count:products.length,
      products
    }))
    .catch(next);
});

router.get('/:id',(req,res,next)=>{
  if(!mongoose.isValidObjectId(req.params.id)){
    return res.status(400).json({message:'Invalid product ID'});
  }
  Product.findById(req.params.id)
    .then(product=>{
      if(!product)return res.status(404).json({message:'Product not found'});
      res.json(product);
    })
    .catch(next);
});

router.put('/:id',validateProduct,(req,res,next)=>{
  if(!mongoose.isValidObjectId(req.params.id)){
    return res.status(400).json({message:'Invalid product ID'});
  }
  Product.findByIdAndUpdate(req.params.id,req.body,{
    new:true,
    runValidators:true,
    context:'query'
  })
    .then(product=>{
      if(!product)return res.status(404).json({message:'Product not found'});
      res.json(product);
    })
    .catch(next);
});

router.patch('/:id/stock',(req,res,next)=>{
  if(!mongoose.isValidObjectId(req.params.id)){
    return res.status(400).json({message:'Invalid product ID'});
  }
  const change=req.body.change;
  if(!Number.isInteger(change)||change===0){
    return res.status(400).json({message:'change must be a non-zero integer'});
  }
  const condition={_id:req.params.id};
  if(change<0)condition.quantity={$gte:Math.abs(change)};

  Product.findOneAndUpdate(condition,{$inc:{quantity:change}},{
    new:true,
    runValidators:true
  })
    .then(product=>{
      if(!product){
        return Product.exists({_id:req.params.id}).then(exists=>{
          if(!exists)return res.status(404).json({message:'Product not found'});
          return res.status(400).json({message:'Insufficient stock for this adjustment'});
        });
      }
      res.json({message:'Stock updated',product});
    })
    .catch(next);
});

router.delete('/:id',(req,res,next)=>{
  if(!mongoose.isValidObjectId(req.params.id)){
    return res.status(400).json({message:'Invalid product ID'});
  }
  Product.findByIdAndDelete(req.params.id)
    .then(product=>{
      if(!product)return res.status(404).json({message:'Product not found'});
      res.json({message:'Product deleted',id:product._id});
    })
    .catch(next);
});

function escapeRegex(value){
  return value.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
}

module.exports=router;


