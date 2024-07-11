var currentYear = new Date().getFullYear();

document.getElementById("copyright").textContent = currentYear;



var text;
var checkoutProducts;
var cartList = [];
var cartListBtnIdList = [];
var itemQty = [];

const urlParams = new URLSearchParams(window.location.search);
const message = urlParams.get('message');
const success = urlParams.get('success');

if (message) {
  console.log("not done");
  const alertElement = document.createElement('div');
  alertElement.textContent = message;
  alertElement.classList.add('alert-message');
  console.log("almost done");
  const body = document.getElementById("main-container");
  body.insertBefore(alertElement, body.firstChild);
  console.log("done");
  setTimeout(() => {
      alertElement.remove();
  }, 3000);
};
if (success) {
  const alertElement = document.createElement('div');
  alertElement.textContent = success;
  alertElement.classList.add('alert-success');

  const body = document.body;

  body.insertBefore(alertElement, body.firstChild);
  setTimeout(() => {
      alertElement.remove();
  }, 3000);
}



  





window.onload = function() {
  // Retrieve data from localStorage
  var storedCartList = localStorage.getItem("cartList");
  var storedCartListBtnIdList = localStorage.getItem("cartListBtnIdList");
  var storedItemQty = localStorage.getItem("itemQty");

  // Check if the data exists and is not null
  if (storedCartList !== null && storedCartListBtnIdList !== null && storedItemQty !== null) {
      // Parse the JSON data
      cartList = JSON.parse(storedCartList);
      cartListBtnIdList = JSON.parse(storedCartListBtnIdList);
      itemQty = JSON.parse(storedItemQty);
      

      cartListBtnIdList.forEach(id => {
        var element = document.getElementById("product"+id);
        if (element) {
          element.disabled = true;
          element.innerHTML = "Already Added!";
        }
      });

    
      // Use the retrieved data
      console.log("Stored cartList:", cartList);
      console.log("Stored cartListBtnIdList:", cartListBtnIdList);
      console.log("Stored itemQty:", itemQty);
  } else {
      console.log("No stored data found or some data is missing.");
  }
};
function sendCart(){

 var storedCartList = localStorage.getItem("cartList");
 var storedCartListBtnIdList = localStorage.getItem("cartListBtnIdList");
 var storedItemQty = localStorage.getItem("itemQty");

 if (storedCartList !== null && storedCartListBtnIdList !== null && storedItemQty !== null) {
    
     cartList = JSON.parse(storedCartList);
     cartListBtnIdList = JSON.parse(storedCartListBtnIdList);
     itemQty = JSON.parse(storedItemQty);
     

     cartListBtnIdList.forEach(id => {
       var element = document.getElementById("product"+id);
       if (element) {
         element.disabled = true;
         element.innerHTML = "Already Added!";
       }
     });

     document.getElementById('cartListInput').value = JSON.stringify(cartList);
     document.getElementById('cartListBtnIdListInput').value = JSON.stringify(cartListBtnIdList);
     document.getElementById('itemQtyInput').value = JSON.stringify(itemQty);
 
     // Submit the form
     document.getElementById('signupForm').submit();
    
    
     // Use the retrieved data
     console.log("Stored cartList:", cartList);
     console.log("Stored cartListBtnIdList:", cartListBtnIdList);
     console.log("Stored itemQty:", itemQty);
 } else {
     console.log("No stored data found or some data is missing.");
 }
}
//document.getElementById("signup").onclick = sendCart()
window.addEventListener("pageshow", function(event) {
  // Check if the page is loaded from the cache
  if (event.persisted) {
      // Retrieve data from localStorage
  var storedCartList = localStorage.getItem("cartList");
  var storedCartListBtnIdList = localStorage.getItem("cartListBtnIdList");
  var storedItemQty = localStorage.getItem("itemQty");

  // Check if the data exists and is not null
  if (storedCartList !== null && storedCartListBtnIdList !== null && storedItemQty !== null) {
      // Parse the JSON data
      cartList = JSON.parse(storedCartList);
      cartListBtnIdList = JSON.parse(storedCartListBtnIdList);
      itemQty = JSON.parse(storedItemQty);
      

      cartListBtnIdList.forEach(id => {
        document.getElementById("product"+id).disabled = true;
        document.getElementById("product"+id).innerHTML = "Already Added!";
      });
      // Use the retrieved data
      console.log("Stored cache cartList:", cartList);
      console.log("Stored cache cartListBtnIdList:", cartListBtnIdList);
      console.log("Stored cache itemQty:", itemQty);
  } else {
      console.log("No stored data found or some data is missing.");
  }
  }
});

function saveUserDataToServer() {
  // Get data from localStorage
  console.log("triggr");
  if (document.getElementById("useremail")) {
    const useremail=document.getElementById("useremail").innerHTML;
    console.log("triggr", useremail);
  

  if (useremail !== '' && useremail !== null) {
     // Make a POST request to the backend
     fetch('/save-user-data', {
      method: 'POST',
      headers: {
          'Content-Type': 'application/json'
      },
      body: JSON.stringify({
          useremail: useremail,
          cartList: cartList,
          cartListBtnIdList: cartListBtnIdList,
          itemQty: itemQty
      })
  })
  .then(response => {
      if (!response.ok) {
          throw new Error('Network response was not ok.');
      }
      return response.json();
  })
  .then(data => {
      console.log('Data saved successfully:', data);
      // Handle success response from the server
  })
  .catch(error => {
      console.error('Error saving data:', error);
      // Handle error
  });
  }
}}


class Cart {
    constructor(price, qty, name, img, id, description) {
      this.price = price;
      this.qty = qty;
      this.name = name;
      this.img = img;
      this.id = id;
      this.description = description;
    }
}

function addToCart(price, qty, name, img, id, description){
    let cartItem = new Cart(price, qty, name, img, id, description);
    cartList.push(cartItem);
    console.log(cartList[cartList.length - 1]);
  cartListBtnIdList.push(id);
  document.getElementById("product"+id).disabled = true; 
  document.getElementById("product"+id).innerHTML = "Already Added!";
  console.log(cartList.length +"and id is "+ id);
  itemQty.push(qty);
  localStorage.setItem("cartList", JSON.stringify(cartList));
  localStorage.setItem("cartListBtnIdList", JSON.stringify(cartListBtnIdList));
  localStorage.setItem("itemQty", JSON.stringify(itemQty));

  saveUserDataToServer();
}


function addToItemCart(productId) {
  // Make an AJAX request to the server
  var xhr = new XMLHttpRequest();
  xhr.open("GET", "/addProductToCart?productId=" + productId, true);
  xhr.onreadystatechange =  function () {
      if (xhr.readyState === 4 && xhr.status === 200) {
          // Parse response JSON
          var product = JSON.parse(xhr.responseText);
          // Call addToCart function with product parameters
           addToCart(product.productPrice, 1, product.productName, product.productImage, product._id, product.productDescription);
      }
  };
  xhr.send();
}

function viewCart(){
    
    document.getElementById("xx").innerHTML = "";
    document.getElementById("checkout-products").innerHTML = "";
    if (cartList.length == 1) {
        document.getElementById("numberOfItems").innerHTML = cartList.length + " " + "item"
        console.log("new length "+cartList.length);
    } else if (cartList.length == 0){
        document.getElementById("numberOfItems").innerHTML =  "Cart is empty"
        console.log("new length "+cartList.length);
    } else {
        document.getElementById("numberOfItems").innerHTML = cartList.length + " " + "items"
        console.log("new length "+cartList.length);
    }
   for (i=0; i < cartList.length; i++){
 
  console.log(Number(cartList[i].price))

  text = '<div class="card border-0">' +
  '<div class="row ">' +
  '<div class="col-4 cart-picture">' +
          '<img src="'+cartList[i].img+'" class="cart-pic-img" alt="'+cartList[i].name+'">' +
      '</div>' +
      '<div class="col-8">' +
          '<h6>'+cartList[i].name+'</h6>' +
          '<h6>&#x20A6 <span>'+cartList[i].price *itemQty[i] +'</span></h6>'+
          '<a class="colored-border" onclick="reduce('+i+')">-</a>'+
          '<span id="item-count'+i+'" class="item-qty">'+itemQty[i]+'</span>'+
          '<a class="colored-border" onclick="increase('+i+')">+</a>'+
          '<iconify-icon icon="la:trash-alt-solid" id="remove" onclick="deleteCartItem('+i+')"></iconify-icon> </div>    <hr class="mt-2"> </div></div>';


checkoutProducts =    '<div class="row">'+
'<div class="col-6">'+
    '<p>'+cartList[i].name+'</p>'+
'</div>'+
'<div class="col-6">' +
    '<h6>&#x20A6 <span>'+cartList[i].price *itemQty[i]+'</span></h6>'+
'</div></div>';
document.getElementById("checkout-products").innerHTML += checkoutProducts;
 document.getElementById("xx").innerHTML += text;
 }
 updatePrices();
}
function reduce(i){
    var itemCount = document.getElementById("item-count"+i).innerHTML
    console.log("reduce " +itemCount)
    if (itemCount == 1) {
      deleteCartItem(i);
      updatePrices();
    } else {
      itemQty[i] = itemQty[i]-1;
      localStorage.setItem("itemQty", JSON.stringify(itemQty));
      saveUserDataToServer()
     viewCart();
    }
  }
  
  function increase(i){
    
    var itemCount = document.getElementById("item-count"+i).innerHTML;
    
    itemQty[i] = itemQty[i]+1;
    localStorage.setItem("itemQty", JSON.stringify(itemQty));
    console.log("increase " +itemCount);
    saveUserDataToServer()
    viewCart();
  }
  function updatePrices(){
    var subTotals = 0;
    
        for (i=0; i < cartList.length; i++){
          
          
            subTotals += Number(cartList[i].price) * itemQty[i];
            document.getElementById("subTotal").innerHTML = subTotals.toFixed(2) ;
            var vats  =110/100;
            var Total =  subTotals * vats;
            document.getElementById("Total").innerHTML = Total.toFixed(2);
            var vatPrice = Total - subTotals;
            document.getElementById("vatsPrice").innerHTML = vatPrice.toFixed(2);
        }
  
  }
  function onClearCartClicked(){
          document.getElementById("xx").innerHTML = "";
          document.getElementById("checkout-products").innerHTML = "";
          document.getElementById("numberOfItems").innerHTML = "Cart is empty";
          document.getElementById("subTotal").innerHTML = 0.00; 
          document.getElementById("Total").innerHTML = 0.00;
          document.getElementById("vatsPrice").innerHTML = 0.00;

 
          cartListBtnIdList.forEach(btnId => {
            document.getElementById("product"+btnId).disabled = false;
            document.getElementById("product"+btnId).innerHTML = "Add To Cart";
          });
          cartList = [];
          cartListBtnIdList = [];
          itemQty = [];
          localStorage.setItem("cartList", JSON.stringify(cartList));
          localStorage.setItem("cartListBtnIdList", JSON.stringify(cartListBtnIdList));
          localStorage.setItem("itemQty", JSON.stringify(itemQty));
          saveUserDataToServer()
  }
  var btnId;
function deleteCartItem(index){
        cartList.splice(index,1);
        itemQty.splice(index, 1);
        btnId = cartListBtnIdList[index];
        console.log(btnId + " and "+ index + " and "+ cartListBtnIdList[index])
        document.getElementById("product"+btnId).disabled = false;
        document.getElementById("product"+btnId).innerHTML = "Add To Cart";
        cartListBtnIdList.splice(index,1);
        localStorage.setItem("cartList", JSON.stringify(cartList));
        localStorage.setItem("cartListBtnIdList", JSON.stringify(cartListBtnIdList));
        localStorage.setItem("itemQty", JSON.stringify(itemQty));
        saveUserDataToServer();
        viewCart();
        if (cartList.length == 0) {
            onClearCartClicked();
          }else {

          }
}

function clearCart(){
  for (xy = 0; xy < cartListBtnIdList.length; xy++){
   document.getElementById(cartListBtnIdList[xy]).disabled = false;
   document.getElementById("product"+cartListBtnIdList[xy]).innerHTML = "Add To Cart";
  }
  cartList.splice(0,cartList.length);
  cartList.length = 0;
  itemQty = [];

 
  viewCart();
  onClearCartClicked();
}
  

function passProductId(productId) {

  window.location.href = "/productPage?id=" + productId;

  console.log("image clicked");

};



const userDataElement = document.getElementById('userData');
const userDataString = userDataElement.value; 
const userData = JSON.parse(userDataString);

if (userDataString !== '') {
  localStorage.setItem('cartList', JSON.stringify(userData.cartList));
localStorage.setItem('cartListBtnIdList', JSON.stringify(userData.cartListBtnIdList));
localStorage.setItem('itemQty', JSON.stringify(userData.itemQty));
}


document.getElementById("signupForm").addEventListener("submit", function(event) {
  if (!this.checkValidity()) {
      event.preventDefault();
      event.stopPropagation();
  }
  this.classList.add("was-validated");
});

// Password Show/Hide functionality
document.querySelector('.passShowHide').addEventListener('click', function() {
  const passwordInput = document.getElementById('signupPassword');
  if (passwordInput.type === 'password') {
      passwordInput.type = 'text';
  } else {
      passwordInput.type = 'password';
  }
  this.textContent = passwordInput.type === 'password' ? 'Show' : 'Hide';
});
