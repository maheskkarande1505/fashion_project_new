var express = require("express");
var router = express.Router();
var exe = require("./../connection");
var url = require("url")

function verify_login(req, res, next)
{
   // req.session.user_id = 1;
    if(req.session.user_id)
        next();
    else
    res.send("<script> location.href = document.referrer+'?open_login_modal' </script> ");
}

function logout(req, res) {
    req.session.destroy(function(err) {
        if (err) {
            return res.status(500).send('Failed to log out.');
        }
       res.send("<script> location.href = document.referrer+'' </script> ");
    });
}

router.get("/logout", logout, function(req, res){
   // res.send("<script> location.href = document.referrer+'?open_login_modal' </script> ");
});

function is_login(req)
{
    if(req.session.user_id)
        return true;
    else
        return false;
}

router.get("/",  async function(req, res){
    var category = await exe('SELECT * FROM category',);
    var products = await exe(`SELECT * FROM products`)
    var obj = {"category":category, "products":products, "is_login":is_login(req)};
    res.render("user/home.ejs", obj);
});


router.get("/products", async function(req, res){
    var category = await exe('SELECT * FROM category');
    var url_data = url.parse(req.url,true).query;
    var cond = '';
    if(url_data.product_type)
    {
        var cond = ` WHERE product_type = '${url_data.product_type}' `;
    }

    if(url_data.category_id)
    {
        var cond = ` WHERE product_category_id = '${url_data.category_id}' `;
    }

    var sql = 'SELECT * FROM products' +cond
    var products = await exe (sql)
    var obj = {"category":category,"products":products, "is_login":is_login(req) };
    res.render("user/products.ejs", obj)
})

router.get("/product_details/:product_id",async function(req,res){
    var category = await exe('SELECT * FROM category');
    var product_info = await exe( `SELECT * FROM products, category, brands
                                   WHERE
                                   products.product_category_id  = category.category_id
                                AND products.product_brand_id = brands.brand_id
                                AND product_id = '${req.params.product_id}'`);

    var in_cart = await exe(`SELECT * FROM  cart WHERE product_id = '${req.params.product_id}' 
                      AND user_id = '${req.session.user_id}' `);

    var obj = {"category":category, "product_info":product_info[0], "in_cart":in_cart, "is_login":is_login(req)};
    res.render("user/product_detials.ejs", obj);
});

router.post("/save_in_cart", verify_login, async function(req, res){
    var d = req.body;
    var user_id  = req.session.user_id;
    var sql = `INSERT INTO cart (user_id, product_id, size, quantity) VALUES (?,?,?,?)`;
    var data = await exe(sql,[user_id, d.product_id, d.size, d.quantity]);
    //res.send(data); 
    res.send("<script> location.href = document.referrer </script>");
});

router.post("/save_account", async function(req, res){
    var d = req.body;
    var sql = `INSERT INTO user_accounts (user_name, mobile, email, password) VALUES (?,?,?,?)`;
    var data = await exe(sql,[d.user_name,d.mobile,d.email,d.password]);
   // res.send(data);
   res.send("<script> location.href = document.referrer </script>");
});

router.post("/proceed_login", async function(req, res){
    var d = req.body;
    var sql = `SELECT * FROM user_accounts WHERE email = ? AND password = ?`;
    var data = await exe(sql,[d.email, d.password]);
    if(data.length > 0)
    {
        var user_id = data[0].user_id;
        req.session.user_id = user_id;
       // res.send("login Success");
       res.send(`
                    <script> 
                         var url =  document.referrer;
                         var new_url = url.replaceAll('?open_login_modal', '');
                         location.href = new_url;
                    </script>
                    `);
    }
    else
    res.send("login Failed");
});




router.get("/cart", verify_login, async function(req, res){
    var d = req.body;
    var sql = `SELECT * FROM cart, products, user_accounts
           WHERE
                cart.user_id = user_accounts.user_id
            AND cart.product_id = products.product_id
            AND cart.user_id = '${req.session.user_id}'
            `;
    var cart_products  = await exe(sql);
    var category = await exe('SELECT * FROM category');
    var obj = {"category":category,"cart_products":cart_products,"is_login":is_login(req) };
    res.render("user/cart.ejs", obj);
})

router.get("/delete_from_cart/:cart_id", verify_login, async function(req, res){
    var id = req.params.cart_id;
    var user_id = req.session.user_id;
    var sql = `DELETE FROM cart WHERE cart_id = '${id}' AND user_id = '${user_id}'`;
    var data = await exe(sql);
   // res.send(data);
    res.redirect("/cart");

});

router.post("/update_cart_qty", verify_login, async function(req, res){
    var d = req.body;
    var sql =`UPDATE cart SET quantity = '${d.new_qty}' WHERE cart_id = '${d.cart_id}' `;
    var data = await exe(sql);
    var sql2 = `SELECT SUM (products.product_price*quantity)
            as all_total FROM cart, products, user_accounts WHERE
                cart.user_id = user_accounts.user_id
            AND cart.product_id = products.product_id
            AND cart.user_id = '${req.session.user_id}' `;
    var data2 = await exe(sql2);
    res.send(data2[0]);
});

router.get("/checkout", verify_login, async function(req, res){
    var category = await exe('SELECT * FROM category');
    var sql = `SELECT SUM (products.product_price * cart.quantity) as total FROM
                products,cart WHERE cart.product_id = products.product_id 
            AND cart.user_id = '${req.session.user_id}'`;
    var data = await exe(sql);

    var sql1 = `SELECT * FROM cart, products, user_accounts
    WHERE
         cart.user_id = user_accounts.user_id
     AND cart.product_id = products.product_id
     AND cart.user_id = '${req.session.user_id}'
     `;
    var cart_products  = await exe(sql1);

    var obj = {"category":category,"total":data[0]['total'], "cart_products":cart_products, "is_login":is_login(req)};
    res.render("user/checkout.ejs", obj);
});

router.post("/confirm_order", async function(req, res){
    var user_id = req.session.user_id;
    var sql =`SELECT * FROM products, cart WHERE cart.product_id = products.product_id
                        AND user_id = '${user_id}'`;
    var products = await exe(sql);
    var d = req.body;
    d.order_date = new Date().toISOString().slice(0,10);
    d.payment_status = 'Pending';
    d.transaction_id = "";
    d.user_id = user_id;

    var sql2 = `SELECT SUM (products.product_price * cart.quantity) as total FROM
            products,cart WHERE cart.product_id = products.product_id 
            AND cart.user_id = '${req.session.user_id}'`;
            var ttl = await exe(sql2);

    d.total = ttl[0].total; 
    var sql3 = `INSERT INTO order_info (user_id,full_name,mobile,street_landmark,city,district,state,country,pin_code,payment_mode,
    order_date,payment_status,transaction_id,total,order_status) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`;
    var data = await exe(sql3,[user_id, d.full_name, d.mobile, d.street_landmark,d.city,d.district,d.state,d.country,
                                  d.pin_code,d.payment_mode,d.order_date,d.payment_status,d.transaction_id, d.total,'Pending']);

    var order_id = data.insertId;
    //products
    products.map(async(row, i)=>{
        prod = [];
        prod[0] = user_id;
        prod[1] = order_id;
        prod[2] = row.product_id;
        prod[3]= row.quantity;
        prod[4]= row.product_price;
        prod[5]= row.product_price * row.quantity;

        var sql4 = `INSERT INTO order_products (user_id, order_id, product_id,quantity, price, total ) VALUES
                                                (?,?,?,?,?,?) `;
        data = await exe(sql4, prod)

    })

     await exe(`DELETE FROM cart WHERE user_id = '${user_id}' `);

    if(req.body.payment_mode == 'online')
    {
        // do payment
        res.redirect("/do_payment/"+ order_id);
    }
    else
    {
        // my Orders
        res.redirect("/my_orders");
    }

})

router.get("/do_payment/:order_id", verify_login, async function(req, res){
    var order_id = req.params.order_id;
    var sql = `SELECT * FROM order_info WHERE order_id = '${order_id}'`;
    var order_info = await exe(sql);
    var obj = {"order_info":order_info[0]}
    res.render("user/do_payment.ejs", obj);
});

router.post("/payment_success/:order_id", verify_login, async function(req, res){
    var order_id = req.params.order_id;
    var sql = `UPDATE order_info SET payment_status = 'Paid',
                transaction_id = '${req.body.razorpay_payment_id}' WHERE 
                order_id = '${order_id}' `;
    var data = await exe(sql);
   // res.send(data);
   res.redirect("/my_orders");

});

router.get("/print_invoice/:order_id", verify_login, async function (req, res){
    var order_id = req.params.order_id;
    var sql = `SELECT * FROM order_info WHERE order_id = '${order_id}'`;
    var order_info = await exe(sql);

    var sql2 = `SELECT * FROM products, order_products WHERE products.product_id = order_products.product_id 
                        AND order_id = '${order_id}'`;   
    var products = await exe(sql2);
    var category = await exe('SELECT * FROM category');
    var obj = {"category":category, "order_info":order_info[0], "products":products, "is_login":is_login(req)}
    res.render("user/print_invoice.ejs", obj);
})

router.get("/my_orders", verify_login, async function(req, res){
    var sql = `SELECT * FROM order_info WHERE user_id = '${req.session.user_id}' `;
    var data = await exe(sql);
    var category = await exe('SELECT * FROM category');
    var obj = {"orders":data,"category":category,"is_login":is_login(req)}
    res.render("user/my_orders.ejs", obj);
});



router.get("/contact_us", async function (req, res){
    var category = await exe('SELECT * FROM category',);
    var obj = {"category":category, "is_login":is_login(req)};
    res.render("user/contact.ejs", obj);
});

router.post("/save_contact_us", async function (req, res){
    var d = req.body;
    var sql = `INSERT INTO contact_us (name, email, phone, message) VALUE (?,?,?,?) `;
    var data = await exe(sql, [d.name, d.email, d.phone, d.message] );
    // res.send(data);
    res.redirect("contact_us");
});

router.get("/about_us",  async function (req, res){
    var category = await exe('SELECT * FROM category',);
    var obj = {"category":category, "is_login":is_login(req)};
    res.render("user/about_us.ejs", obj);
});




module.exports = router;