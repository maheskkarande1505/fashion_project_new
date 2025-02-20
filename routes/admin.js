var express = require("express");
var router = express.Router();
var exe = require("./../connection")


router.get("/", async function (req, res){

    res.render("admin/admin_login.ejs")
})

router.get("/admin_page", async function(req, res){
    
    
    // Pending Order Count
    var sql1 =` SELECT COUNT(*) as ttl FROM order_info WHERE order_status = 'Pending' `;
    var pending_orders = await exe(sql1);

    var sql2 = `SELECT SUM(total) as ttl FROM order_info WHERE order_status = 'Pending' AND payment_status = 'Paid' `;
    var pending_order_paid_amount = await exe(sql2);

    var sql3 = `SELECT SUM(total) as ttl FROM order_info WHERE order_status = 'Pending' AND payment_status = 'Pending' `;
    var pending_order_unpaid_amount = await exe(sql3);

    // Dispatch Order Count

    var sql4 =` SELECT COUNT(*) as ttl FROM order_info WHERE order_status = 'Dispatch' `;
    var dispatch_orders = await exe(sql4);

    var sql5 = `SELECT SUM(total) as ttl FROM order_info WHERE order_status = 'Dispatch' AND payment_status = 'Paid' `;
    var dispatch_order_paid_amount = await exe(sql5);

    var sql6 = `SELECT SUM(total) as ttl FROM order_info WHERE order_status = 'Dispatch' AND payment_status = 'Pending' `;
    var dispatch_order_unpaid_amount = await exe(sql6);

    // Deliver Order Count

    var sql7 =` SELECT COUNT(*) as ttl FROM order_info WHERE order_status = 'Deliver' `;
    var deliver_orders = await exe(sql7);

    var sql8 = `SELECT SUM(total) as ttl FROM order_info WHERE order_status = 'Deliver' AND payment_status = 'Paid' `;
    var deliver_order_paid_amount = await exe(sql8);

    var sql9 = `SELECT SUM(total) as ttl FROM order_info WHERE order_status = 'Deliver' AND payment_status = 'Pending' `;
    var deliver_order_unpaid_amount = await exe(sql9);


    var xaxis = [];
    var yaxis = [];

    var ctime  = new Date().getTime();
    for(var i=0;i<7;i++)
    {       

        var newtime = ctime-(86400*1000)*i
        var newdate = new Date(newtime).toISOString().slice(0,10);
        xaxis.push(newdate);

        var amount = await exe(`SELECT SUM(total) as ttl FROM order_info WHERE order_date = '${newdate}'`);
        yaxis.push( amount[0].ttl);
    }

    var obj = {
               "pending_orders":pending_orders[0], 
               "pending_order_paid_amount":pending_order_paid_amount[0],
               "pending_order_unpaid_amount":pending_order_unpaid_amount[0],
               "dispatch_orders":dispatch_orders[0], 
               "dispatch_order_paid_amount":dispatch_order_paid_amount[0],
               "dispatch_order_unpaid_amount":dispatch_order_unpaid_amount[0],
               "deliver_orders":deliver_orders[0], 
               "deliver_order_paid_amount":deliver_order_paid_amount[0],
               "deliver_order_unpaid_amount":deliver_order_unpaid_amount[0],
               "xaxis":xaxis,
               "yaxis":yaxis
             }
    res.render("admin/home.ejs",obj);
});

//Category
router.get("/add_category", function(req,res){
    res.render("admin/add_category.ejs")
});

router.post("/save_category", async function(req, res){
    var d = req.body;
    d.category_name = d.category_name.replaceAll("'","\\'");
    d.category_details = d.category_details.replaceAll("'","\\'");
    var sql = `INSERT INTO category (category_name, category_details)  VALUES ('${d.category_name}','${d.category_details}') `;
    var data = await exe(sql);
    //res.send(data);
    res.redirect("/admin/add_category")
})

router.get("/category_list", async function(req,res){
    var sql = `SELECT * FROM category`;
    var data = await exe(sql);
    var obj = {"categories":data}
    res.render("admin/category_list.ejs", obj) ; 
})

router.get("/delete_category/:id", async function(req, res){
    var id = req.params.id
    var sql = `DELETE FROM category WHERE category_id = '${id}'`;
    var data = await exe(sql);
    //res.send(data);
    res.redirect("/admin/category_list")
});

router.get("/edit_category/:id", async function (req, res){
    var id = req.params.id;
    var sql = `SELECT * FROM category WHERE category_id = '${id}'`;
    var data = await exe(sql);
    var obj = {"categories":data[0]};
   // res.send(data)
    res.render("admin/edit_category.ejs", obj);
});


router.post("/update_category", async function (req, res){
    var d = req.body;
    var sql = `UPDATE category SET category_name = '${d.category_name}',
                                   category_details = '${d.category_details}' 
                             WHERE category_id = '${d.category_id}' `;
    var data = await exe(sql);
   // res.send(data);
   res.redirect("/admin/category_list");
});


// Brand
router.get("/add_brand", function(req,res){
    res.render("admin/add_brand.ejs");
});

router.post("/save_brand", async function(req, res){
    var d = req.body;
    var new_name = new Date().getTime()+req.files.brand_image.name;
    req.files.brand_image.mv("public/uploads/"+new_name)
    
  //  var sql = `INSERT INTO brands (brand_name, brand_image, brand_details)  VALUES ('${d.brand_name}','${new_name}','${d.brand_details}') `;
  //  var data = await exe(sql);
            // OR
    var sql = `INSERT INTO brands (brand_name, brand_image, brand_details)  VALUES (?,?,?) `;
    var data = await exe(sql, [d.brand_name, new_name, d.brand_details] );
    
    //res.send(data);
    res.redirect("/admin/add_brand")
});

router.get("/brand_list", async function(req, res){
    var sql = `SELECT * FROM brands`;
    var data = await exe(sql);
    var obj = {"brands":data};
    res.render("admin/brand_list.ejs", obj);
});

router.get("/delete_brand/:id", async function(req, res){
    var id = req.params.id
    var sql = `DELETE FROM brands WHERE brand_id = '${id}'`;
    var data = await exe(sql);
    //res.send(data);
    res.redirect("/admin/brand_list")
});

router.get("/edit_brand/:id", async function (req, res){
    var id = req.params.id;
    var sql = `SELECT * FROM brands WHERE brand_id = '${id}'`;
    var data = await exe(sql);
    var obj = {"brands":data[0]};
   // res.send(data)
    res.render("admin/edit_brand.ejs", obj);
});

router.post("/update_brand", async function (req, res){
    var d = req.body;
    var sql = `UPDATE brands SET brand_name = '${d.brand_name}',
                                   brand_details = '${d.brand_details}' 
                             WHERE brand_id = '${d.brand_id}' `;
    var data = await exe(sql);  
   // res.send(data);
   res.redirect("/admin/brand_list");
});

// Product

router.get("/add_product", async function(req,res){

    var brands = await exe(`SELECT * FROM brands`)
    var category = await exe(`SELECT * FROM category`)
    var obj = {"brands":brands, "category":category}
    res.render("admin/add_product.ejs", obj);
});

router.post("/save_product",async function(req, res){

    var product_image1 = "";
    var product_image2 = "";
    var product_image3 = "";
    var product_image4 = "";

    if(req.files)
    {
        if(req.files.product_image1)
        {
            product_image1 = new Date().getTime()+req.files.product_image1.name;
            req.files.product_image1.mv("public/uploads/"+product_image1);
        }

        if(req.files.product_image2)
        {
            product_image2 = new Date().getTime()+req.files.product_image2.name;
            req.files.product_image2.mv("public/uploads/"+product_image2);
        }

        if(req.files.product_image3)
        {
            product_image3 = new Date().getTime()+req.files.product_image3.name;
            req.files.product_image3.mv("public/uploads/"+product_image3);
        }

        if(req.files.product_image4)
        {
            product_image4 = new Date().getTime()+req.files.product_image4.name;
            req.files.product_image4.mv("public/uploads/"+product_image4);
        }
    }

     var d = req.body;
     var sql = `INSERT  INTO products (product_name,product_price,product_purchase_price,product_brand_id,
                          product_category_id,product_type,product_details,product_size,product_color,
                          product_image1,product_image2,product_image3,product_image4) VALUES
                          (?,?,?,?,?,?,?,?,?,?,?,?,?)`;
    var data = await exe(sql, [d.product_name,d.product_price, d.product_purchase_price,d.product_brand_id,
                                d.product_category_id,d.product_type,d.product_details,d.product_size,d.product_color,
                                product_image1,product_image2,product_image3,product_image4]);
    //res.send(data);
    res.redirect("/admin/add_product");
})

router.get("/product_list",async function(req,res){
    var sql = `SELECt * FROM products, category, brands WHERE
                    products.product_category_id = category.category_id
                AND products.product_brand_id = brands.brand_id
                `;
    var data = await exe(sql);
    var obj = {"products":data};
    res.render("admin/product_list.ejs", obj);
});

router.get("/delete_product/:id", async function(req, res){
    var id = req.params.id
    var sql = `DELETE FROM products WHERE product_id = '${id}'`;
    var data = await exe(sql);
    //res.send(data);
    res.redirect("/admin/product_list")
});

router.get("/edit_product/:id", async function (req, res){
    var id = req.params.id;
    var sql = `SELECT * FROM products WHERE product_id = '${id}'`;
    var brands = await exe(`SELECT * FROM brands`)
    var category = await exe(`SELECT * FROM category`)
    var data = await exe(sql);
    var obj = {"products":data[0],"brands":brands, "category":category};
   // res.send(data)
    res.render("admin/edit_product.ejs", obj);
});


router.post("/update_product", async function (req, res){
    var d = req.body;
    var sql = `UPDATE products SET product_name = '${d.product_name}',
                                   product_price = '${d.product_price}',
                                   product_purchase_price = '${d.product_purchase_price}',
                                   product_brand_id = '${d.product_brand_id}',
                                   product_category_id = '${d.product_category_id}',
                                   product_type = '${d.product_type}',
                                   product_details = '${d.product_details}',
                                   product_size = '${d.product_size}',
                                   product_color = '${d.product_color}'

                             WHERE product_id = '${d.product_id}' `;
    var data = await exe(sql);  
   // res.send(data);
   res.redirect("admin/product_list");
});

router.get("/pending_orders", async function(req, res){
    var sql = `SELECT * FROM order_info WHERE order_status = 'Pending'`;
    var data = await exe(sql);
    var obj = {"pending_orders":data};
    res.render("admin/pending_orders.ejs", obj);
});

router.get("/dispatch_orders", async function(req, res){
    var sql = `SELECT * FROM order_info WHERE order_status = 'Dispatch'`;
    var data = await exe(sql);
    var obj = {"dispatch_orders":data};
    res.render("admin/dispatch_orders.ejs", obj);
});  

router.get("/deliverd_orders", async function(req, res){
    var sql = `SELECT * FROM order_info WHERE order_status = 'Deliver'`;
    var data = await exe(sql);
    var obj = {"deliver_orders":data};
    res.render("admin/deliverd_orders.ejs", obj);
});

router.get("/order_details/:order_id", async function(req, res){
    var order_id = req.params.order_id;
    var sql = `SELECT * FROM order_info WHERE order_id = '${order_id}'`;
    var order_info = await exe(sql);

    var sql2 = `SELECT * FROM products, order_products WHERE products.product_id = order_products.product_id 
                        AND order_id = '${order_id}'`;   
    var products = await exe(sql2);
    var obj = {"order_info":order_info[0], "products":products}
    res.render("admin/order_details.ejs", obj);

});

router.get("/change_order_status_to_dispatch/:order_id", async function(req, res){
    var order_id = req.params.order_id;

    var sql = `UPDATE order_info SET order_status = 'Dispatch' WHERE order_id = '${order_id}' `;
    var data = await exe(sql);
   // res.send("Dipatching Order "+ order_id)
    res.redirect("/admin/pending_orders");
});

router.get("/change_order_status_to_deliver/:order_id", async function(req, res){
    var order_id = req.params.order_id;

    var sql = `UPDATE order_info SET order_status = 'Deliver', payment_status = 'Paid' WHERE order_id = '${order_id}' `;
    var data = await exe(sql);
   // res.send("Dipatching Order "+ order_id)
    res.redirect("/admin/dispatch_orders");
});

router.post("/proceed_admin_login", async function(req,res){

    var d = req.body;
    var sql = `SELECT * FROM admin_accounts WHERE email = ? AND password = ?`;
    var data = await exe(sql,[d.email, d.password]);
    if(data.length > 0)
    {
        var admin_id = data[0].admin_id;
        req.session.admin_id = admin_id;
      // res.send("login Success");
       res.send(`
                    <script> 
                         var url =  document.referrer;
                         var new_url = url.replaceAll('admin', 'admin/admin_page');
                         location.href = new_url;
                    </script>
                    `);
    }
    else
    res.send(`
             <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Login Failed</title>
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        height: 100vh;
                        background-color: #f8d7da;
                        margin: 0;
                    }
                    .container {
                        text-align: center;
                        background: white;
                        padding: 20px;
                        border-radius: 10px;
                        box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
                    }
                    h2 {
                        color: #721c24;
                    }
                    p {
                        color: #721c24;
                    }
                    a {
                        display: inline-block;
                        margin-top: 15px;
                        padding: 10px 20px;
                        text-decoration: none;
                        background-color: #dc3545;
                        color: white;
                        border-radius: 5px;
                    }
                    a:hover {
                        background-color: #c82333;
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <h2>Login Failed</h2>
                    <p>Incorrect username or password. Please try again.</p>
                    <a href="/login">Back to Login</a>
                </div>
            </body>
            </html>
        `);
})


module.exports = router;    