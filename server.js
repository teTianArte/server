// server.js
// where your node app starts

// we've started you off with Express (https://expressjs.com/)
// but feel free to use whatever libraries or frameworks you'd like through `package.json`.
let express = require("express");

let app = express();
let cors = require('cors');
let bodyParser = require("body-parser");
app.use(bodyParser.raw({ type: "*/*" }));
app.use(cors());

// getToken() function
let tok_num = 5676;
let count = 0;
let tok_string = "";
let getTokNum = () => {
  return ++tok_num;
};

let getToken = () => {
  return "user_id" + getTokNum().toString();
};


// getListingId() function

let list_num = 101;
let counter = 0;
let list_string = "";
let getListNum = () => {
  return ++list_num;
};

let getListingId = () => {
  return "list_Id" + getListNum().toString();
};


let passwords = new Map();
let tok_map = new Map(); //tok_map.set(token, username)
let tok_map_rev = new Map(); //tok_map_rev.set(username, token)
let list_map = new Map();  // list_map.set(lid, listings) - Item Id and products information
let seller_map = new Map(); // seller_map.set(lid, token); table for items by seller 
let cart_map = new Map();  // cart_map.set (lid and token) - table for items in the cart
let sold_map = new Map(); // sold_map.set (lid and token )- table for already sold items
let shipped_map = new Map(); // shipped_map.set (lid, seller)
let messages = [];
let review_map = new Map();



app.get("/", (req, res) => {
  res.sendFile(__dirname + "/views/index.html");
});
// SOURCE TO SERVER TEST
app.get("/sourcecode", (req, res) => {
res.send(require('fs').readFileSync(__filename).toString())
});


//OPEN PORT
app.listen(process.env.PORT || 4000, () => {
  console.log("OK");
});

//POST SIGNUP endpont---------------------------------------------
app.post("/signup", (req, res) => {
  let parsed = JSON.parse(req.body);
  let username = parsed.username;
  let password = parsed.password;
  let msg = undefined;
  if (!password || !username) {
    /*default cases*/
    !password ? (msg = "password field missing") : (msg = "username field missing");
  }else if (passwords.has(username)) {
      msg = "Username exists";
  }
  if (msg) res.send(JSON.stringify({ success: false, reason: msg }));
  else {
    passwords.set(username, password);
    res.send(JSON.stringify({ success: true }));
  }
});

//POST LOGIN endpont-----------------------------------------------
app.post("/login", (req, res) => {
  let parsed = JSON.parse(req.body);
  let username = parsed.username;
  let actualPassword = parsed.password;
  let expectedPassword = passwords.get(username);
  let msg = undefined;
  let token;
  if (!actualPassword || !username) {
    /*default cases*/
    !actualPassword ? (msg = "password field missing"): (msg = "username field missing");
  }
  else if (!passwords.has(username)) msg = "User does not exist";
  else if (expectedPassword !== actualPassword) msg = "Invalid password";
  if (msg) {
    res.send(JSON.stringify({ success: false, reason: msg }));
  }else{
    token = getToken();
    tok_map.set(token, username);
    tok_map_rev.set(username, token);
    res.send(JSON.stringify({ success: true, token: token }));
  }
  
});

//POST CHANGE-PASSWORD endpoint------------------------------------

app.post("/change-password", (req, res) => {
  let parsed = JSON.parse(req.body);
  let oldPassword = parsed.oldPassword;
  let newPassword = parsed.newPassword;
  let token = req.headers.token;
  let msg = undefined;
  let user = tok_map.get(token);
  
  if (!token){
    msg = "token field missing";
  } else if (!tok_map.has(token)) msg = "Invalid token";
    else if (passwords.get(user) !== oldPassword) msg = "Unable to authenticate";
    
  
  if (msg) {
    res.send(JSON.stringify({ success: false, reason: msg}));
  }else{
        passwords.set(user, newPassword); 
       res.send(JSON.stringify({ success: true}));
  }
});


//POST CREATE-LISTING endpoint-------------------------------------

app.post("/create-listing", (req, res) => {
  let parsed = JSON.parse(req.body);
  let price = parsed.price;
  let description = parsed.description;
  let token = req.headers.token;
  let msg = undefined;
  let listings = [];
  let lid;
  let sellerUsername = tok_map.get(token);
    
  if (!token){
    msg = "token field missing";
  } else if (!tok_map.has(token)) {
    msg = "Invalid token";
  } else if (!price){ 
    msg = "price field missing"
  }else if (!description) {
      msg = "description field missing"
  }
  
  if (msg) {
    res.send(JSON.stringify({ success: false, reason: msg}));
  }else{
    
      listings.push({price:price, description: description})
   
      lid = getListingId()
     
      seller_map.set(lid, token);
      list_map.set(lid, listings)
    
    res.send(JSON.stringify({ success: true, listingId: lid}));
  }
 });

//GET LISTING endpoint---------------------------------------------

app.get("/listing", (req, res) => {

    let lid = req.query.listingId;
    let seller_tok;
    let listings = [];
   
    let msg = undefined;
    let price
    let desc
   
   
    if (!list_map.has(lid)){
      msg = "Invalid listing id";
      res.send(JSON.stringify({ success: false, reason: msg}));
    
} else {
      listings = list_map.get(lid) // get array with description and price from the listing id
      price = listings[0].price
      desc = listings[0].description
  
      seller_tok = seller_map.get(lid) // get seller token form the listing id
  
      let username = tok_map.get(seller_tok)
      
      res.send(JSON.stringify({ success: true, listing: {price:price, description: desc, itemId: lid, sellerUsername: username}}))
  }
});

 //POST MODIFY-LISTING endpoint-------------------------------------
app.post("/modify-listing", (req, res) => {
  let parsed = JSON.parse(req.body);
  let lid = parsed.itemid;
  let price = parsed.price;
  let description = parsed.description;
  let token = req.headers.token;
  let msg = undefined;
  let new_listing = []
  
  if (!token){
    msg = "token field missing";
  } else if (!tok_map.has(token)) {
    msg = "Invalid token";
  } else if (!lid){ 
    msg = "itemid field missing"
  }
  
  if (msg) {
    res.send(JSON.stringify({ success: false, reason: msg}));
  }else{
       let listing = list_map.get(lid);
       let old_price = listing[0].price;
       let old_desc = listing[0].description;
    
       if (!price)
          price = old_price;
       if (!description)
         description = old_desc;
    
       new_listing.push({price:price, description: description});
       list_map.set(lid, new_listing);
       res.send(JSON.stringify({ success: true}));
  }
});

 //POST ADD-TO-CART endpoint----------------------------------------

app.post("/add-to-cart", (req, res) => {
  let parsed = JSON.parse(req.body);
  let token = req.headers.token;
  let lid = parsed.itemid;
  let msg = undefined;
  let tokens = [];
  
  if (!tok_map.has(token)) {
    msg = "Invalid token";
  } else if (!lid){ 
    msg = "itemid field missing"
  } else if(!list_map.has(lid))
  {
    msg = "Item not found"
  }
    if (msg) {
    res.send(JSON.stringify({ success: false, reason: msg}));
  }else{

    
    if (!cart_map.has(lid)){
      tokens.push(token)
    }else{
      tokens = cart_map.get(lid);
      if (!tokens.includes(token))
          tokens.push(token);
    }
    cart_map.set(lid, tokens)
    
    
    res.send(JSON.stringify({ success: true}));
  }
  
  });
 
//GET CART endpoint-------------------------------------------------

app.get("/cart", (req, res) => {

    let token = req.headers.token;
    let msg = undefined;
    
    let cart = [];
    let found;
   
    if (!tok_map.has(token)) {
      msg = "Invalid token";
    }
    if (msg) {
      res.send(JSON.stringify({ success: false, reason: msg}));
    } 
    else {
      var data,seller_tok,seller_name,price,desc;
       for (const [key, value] of cart_map.entries()) {
        
         
        if ( value.includes(token) ) {
          data = list_map.get(key);
          seller_tok = seller_map.get(key)
          seller_name = tok_map.get(seller_tok)
          price = data[0].price;
          desc = data[0].description;
          cart.push({price:price, description: desc, itemId: key, sellerUsername: seller_name})
          
       }
     }
   
    res.send(JSON.stringify({ success: true, cart: cart}))

  }

});

//POST CHECKOUT endpoint--------------------------------------------

app.post("/checkout", (req, res) => {
  
  let token = req.headers.token;
  let msg = undefined;
  let empty_cart = true;
  let buyers = [];
  
   if (!token) msg = "token field missing";
   else if (!tok_map.has(token)) msg = "Invalid token";
   else {
        for (const [key, value] of cart_map.entries()) {
        if ( value.includes(token) ) 
        {
          empty_cart = false;
            if (sold_map.has(key)){
              msg = "Item in cart no longer available";
              break;
          }
        }  

     }
    if (empty_cart) msg = "Empty cart";
   }
    
    if (msg) {
       res.send(JSON.stringify({ success: false, reason: msg}));
     } else {
       let lid
       for (const [key, value] of cart_map.entries()) {
         if ( value.includes(token) ) {
             
              lid = key;
              
              if (value.size <= 1)
                cart_map.delete(lid); //remove the listing from the cart
              else
              {
                buyers = cart_map.get(lid);
                buyers.splice(value.indexOf(token),1);  
                cart_map.set(lid, buyers);
              }
              //seller_map.delete(lid) //listing is no longer belongs to the seller
               sold_map.set(lid, token) //means the item is sold to some specific buyer. 
           }
       }  
      res.send(JSON.stringify({ success: true}));
  }
});


//GET PURCHASE-HISTORY endpoint-------------------------------------

app.get("/purchase-history", (req, res) => {

    let token = req.headers.token;
    let msg = undefined;
    let purchased = [];
  
    if (!tok_map.has(token)) {
      msg = "Invalid token";
      }
    if (msg) {
        res.send(JSON.stringify({ success: false, reason: msg}));
    }else {
      var data,seller_tok,seller_name,price,desc;
       for (const [key, value] of sold_map.entries()) {

        if ( value === token ) {
          data = list_map.get(key);
          seller_tok = seller_map.get(key)
          seller_name = tok_map.get(seller_tok)
          price = data[0].price;
          desc = data[0].description;
          purchased.push({price:price, description: desc, itemId: key, sellerUsername: seller_name})
          
       }
     } 
      res.send(JSON.stringify({ success: true, purchased: purchased}))
  }

});

//POST CHAT endpoint------------------------------------------------
app.post("/chat", (req, res) => {
  
  let token = req.headers.token;
  var parsed, destination, content;
 
  if ( Object.keys(req.body).length > 0 )
  {
    parsed = JSON.parse(req.body);
    destination = parsed.destination;
    content = parsed.contents;
  }
  
  let msg = undefined;
  
  if (!token) {
    msg = "token field missing";
  } else if (!tok_map.has(token)) {
    msg = "Invalid token";
  } else if (!destination){
    msg = "destination field missing";
  }else if (!content){
     msg = "contents field missing";
  }else if  (!tok_map_rev.has(destination)){
     msg = "Destination user does not exist";
  }
  
  if (!msg) {
           let user = tok_map.get(token);
           let destination_token = tok_map_rev.get(destination);
           
           messages.push({from: user, to: destination, contents:content});
   
           res.send(JSON.stringify({ success: true}));
          
    }else {
    res.send(JSON.stringify({ success: false, reason: msg}));
  }
 });

//POST CHAT-MESSAGES endpoint---------------------------------------
app.post("/chat-messages", (req, res) => {
    let msg = [];
    let token = req.headers.token;
    var parsed, destination;
 
    if ( Object.keys(req.body).length > 0 )
    {
      parsed = JSON.parse(req.body);
      destination = parsed.destination;
    }
  
    let error = undefined;
    if (!token) {
      error = "token field missing";
    }else if (!tok_map.has(token)) {
      error = "Invalid token";
    }else if (!destination){
       error = "destination field missing";
    }else if (!tok_map_rev.has(destination)){
      error = "Destination user not found";
    }
  
    if (!error)
    {
      let from = tok_map.get(token);

      for (let i = 0; i < messages.length; i++)
      {
         if (messages[i].from == from && messages[i].to == destination || 
          messages[i].from == destination && messages[i].to == from) {
            msg.push({from: messages[i].from, contents: messages[i].contents})
         }
      }
     res.send(JSON.stringify({ success: true, messages: msg }))
        
    }else{
      res.send(JSON.stringify({ success: false, reason: error}));
    }  
})

//POST SHIP endpoint------------------------------------------------
app.post("/ship", (req, res) => {
  
    let token = req.headers.token;
    var lid,parsed;
 
    if ( Object.keys(req.body).length > 0 )
    {
      parsed = JSON.parse(req.body);
      lid = parsed.itemid;
    }
    let error = undefined;
  
    if (!token) {
      error = "token field missing";
    }else if (!tok_map.has(token)) {
      error = "Invalid token";
    }else if (!sold_map.has(lid)){
       error = "Item was not sold";
    }else if (shipped_map.has(lid)){
      error = "Item has already shipped";
    }else if (seller_map.get(lid)!==token)
      error = "User is not selling that item";
  
    if (!error)
    {
      shipped_map.set(lid, token);
      res.send(JSON.stringify({ success: true}))
        
    }else{
      res.send(JSON.stringify({ success: false, reason: error}));
    }  
})
//GET STATUS endpoint-----------------------------------------------
app.get("/status", (req, res) => {
  
    let lid = req.query.itemid;
    let status = undefined;
    let success = false;
  
    if (!sold_map.has(lid))
    {
      status = "Item not sold";
    } else if (shipped_map.has(lid)) 
    {
      status = "shipped";
      success = true;
    } else 
    {
      status = "not-shipped";
      success = true;
    } 
    
    if (success) 
      res.send(JSON.stringify({ success: success, status: status}));
    else 
      res.send(JSON.stringify({ success: success, reason: status}));

  });

//POST REVIEW-SELLER endpoint---------------------------------------
app.post("/review-seller", (req, res) => {
  let parsed = JSON.parse(req.body);
  let token = req.headers.token;
  let rate = parsed.numStars;
  let content = parsed.contents;
  let lid = parsed.itemid;
  let msg = undefined;
  let reviews = [];
  
  if (!tok_map.has(token)){
    msg = "Invalid token";
    
  } else if (!sold_map.has(lid) || sold_map.get(lid) !== token){

    msg = "User has not purchased this item";
  } else if (review_map.has(lid))
    msg = "This transaction was already reviewed";
  
    if (msg)
    res.send(JSON.stringify({ success: false, reason: msg}));
    else {
         let buyer = tok_map.get(token);
         let seller_token = seller_map.get(lid);
         let seller = tok_map.get(seller_token);
             reviews.push({seller: seller, from: buyer, numStars: rate, contents: content});
             review_map.set(lid, reviews);
         res.send(JSON.stringify({ success: true}));
      }
  
});

//GET REVIEWS endpoint-----------------------------------------------
app.get("/reviews", (req, res) => {
  
  let username = req.query.sellerUsername;
  
  let reviewer;
  let reviews = [];
  
   if (tok_map_rev.has(username)){
        for (const [key, value] of review_map.entries()) {

        if (value[0].seller === username) {
         reviews.push({from: value[0].from, numStars: value[0].numStars, contents:value[0].contents})  
         
       }
     } 
   }
       res.send(JSON.stringify({ success: true, reviews: reviews}));
});

//GET selling endpoint-----------------------------------------------

app.get("/selling", (req, res) => {
  let username = req.query.sellerUsername;
  
  let seller_token = tok_map_rev.get(username);
  let msg = undefined;
  let selling = [];
  
  if(!username)                      msg = "sellerUsername field missing"
  else {
     let data;
     for (const [key, value] of seller_map.entries()) {

        if (value === seller_token && !sold_map.has(key)) {
          
         data = list_map.get(key)
         selling.push({price: data[0].price, description: data[0].description, sellerUsername: username, itemId: key})  
      }
     } 
     
    } 
  
  if (msg)  res.send(JSON.stringify({ success: false, reason: msg}));
  else res.send(JSON.stringify({ success: true, selling: selling}));
 
});

//helpers
app.get("/tokens", (req, res) => {
  console.log("I am here");
  for (const [key, value] of tok_map.entries()) {
    console.log(key, value);
  }
  res.send("tokens request");
});

app.post("/setToken", (req, res) => {
  let token = req.headers.token;
  tok_map.set(token)
  res.send("good");
});
app.get("/test", (req, res) => {
  res.send(sold_map.length);
});
