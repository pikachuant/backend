const asyncHandler=(requesthandler)=>{
   return (req,res,next)=>{
    Promise
    .resolve(requesthandler(req,res,next))
    //if promised resolve then ok when not resolved it saying "throw" this word simply said the promise is rejected 
    //this word "throw" only work on promise to say the promise that the promise is rejected and then catch part will recovered the
    //error object created by Apierror object creator
    //error=error object conatin all details which is a truthy value
    .catch((error)=>next(error))
    //next() is just simple next execution but 
    //next(truthy value/any value) give instruction to stop further execution to express
   }
}

export {asyncHandler}
//Basically it's  a wraper which ensure that whenever any issue arrise it will be automatically tell the express to stop further execution
//it's a error handler system
//Also Due to i don't have error Print System when "error" object pass to express through "next(error)"
//the express Default Error handler simple Handle the Error and send default message by obtaining "error.message"