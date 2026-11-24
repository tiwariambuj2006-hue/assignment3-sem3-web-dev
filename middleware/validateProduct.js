const allowedFields=['name','sku','category','price','quantity','reorderLevel','supplier'];

function validateProduct(req,res,next){
  if(!req.body||typeof req.body!=='object'||Array.isArray(req.body)){
    return res.status(400).json({message:'Request body must be a JSON object'});
  }

  const unknownFields=Object.keys(req.body).filter(field=>!allowedFields.includes(field));
  if(unknownFields.length){
    return res.status(400).json({
      message:'Unknown product field(s)',
      fields:unknownFields
    });
  }

  if(req.method==='POST'){
    const requiredFields=['name','sku','category','price'];
    const missingFields=requiredFields.filter(field=>
      req.body[field]===undefined||req.body[field]===null||req.body[field]===''
    );
    if(missingFields.length){
      return res.status(400).json({
        message:'Missing required product field(s)',
        fields:missingFields
      });
    }
  }

  next();
}

module.exports=validateProduct;
