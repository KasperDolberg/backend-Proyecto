const fs = require('fs');
const path = require('path');

const productosFile = './data/productos.json';
const carritosFile = './data/carrito.json';

const finished = (error) => {
    if (error) {
        console.error(error);
        return;
    }
};

let resp = 9099;

codes_translator = function (code) {
    const translations = {
        9099: 'Operación exitosa',
        9001: 'Error: stock no válido',
        9002: 'Error: código de producto duplicado',
        9101: 'Error: carrito no encontrado',
    };
    return translations[code] || 'Error desconocido';
};

class ProductsManager {
    constructor(file_path = process.cwd(), file = productosFile) {
        this.file_path = file_path;
        this.file = file;
        this.original_products = {};
        this.current_id = 0;

        if (!fs.existsSync(path.join(this.file_path, this.file))) {
            try {
                fs.writeFileSync(path.join(this.file_path, this.file), JSON.stringify(this.original_products, null, 2));
            } catch (e) {
                console.log(`Error: ${e}`);
            }
        }

        const read_products = fs.readFileSync(path.join(this.file_path, this.file), 'utf-8');
        this.products = JSON.parse(read_products);
        this.current_id = Object.keys(this.products)[Object.keys(this.products).length - 1];
    }

    getProducts() {
        if (this.current_id >= 1) {
            return this.products;
        } else {
            return undefined;
        }
    }

    addProduct(title, description, code, price, status = true, stock, category, thumbnails = []) {
        if (stock <= 0 || typeof stock !== 'number') {
            resp = 9001;
            return resp;
        }

        let ids = [];
        let codes = [];
        Object.entries(this.products).forEach((producto) => {
            ids.push(producto[0]);
            codes.push(producto[1]['code']);
        });

        let max = Math.max(...ids);

        if (max == '-Infinity') {
            max = 0;
        }

        if (codes.includes(code)) {
            resp = 9002;
            return resp;
        }

        let this_item = {};

        this_item.id = max + 1;
        this_item.title = title;
        this_item.description = description;
        this_item.code = code;
        this_item.price = price;
        this_item.status = status;
        this_item.stock = stock;
        this_item.category = category;
        this_item.thumbnails = thumbnails;

        this.products[this_item.id] = this_item;

        fs.writeFileSync(path.join(this.file_path, this.file), JSON.stringify(this.products, null, 2), 'utf-8', finished);
        return resp;
    }

    editProduct(id, title, description, code, price, status = true, stock, category, thumbnails = []) {
        if (stock < 0 || typeof stock !== 'number') {
            resp = 9001;
            return resp;
        }

        let this_item = this.products[id];

        this_item.id = id;
        this_item.title = title;
        this_item.description = description;
        this_item.code = code;
        this_item.price = price;
        this_item.status = status;
        this_item.stock = stock;
        this_item.category = category;
        this_item.thumbnails = thumbnails;

        this.products[id] = this_item;

        fs.writeFileSync(path.join(this.file_path, this.file), JSON.stringify(this.products, null, 2), 'utf-8', finished);
        return resp;
    }

    deleteProduct(id) {
        if (this.products[id]) {
            delete this.products[id];

            fs.writeFileSync(path.join(this.file_path, this.file), JSON.stringify(this.products, null, 2), 'utf-8', finished);
            return resp;
        }
        return resp;
    }
}


class CartsManager {
    constructor(file_path = process.cwd(), file = carritosFile) {
        this.file_path = file_path;
        this.file = file;
        this.original_carts = {};
        this.current_id = 0;

        if (!fs.existsSync(path.join(this.file_path, this.file))) {
            try {
                fs.writeFileSync(path.join(this.file_path, this.file), JSON.stringify(this.original_carts, null, 2));
            } catch (e) {
                console.log(`Error: ${e}`);
            }
        }

        const read_carts = fs.readFileSync(path.join(this.file_path, this.file), 'utf-8');
        this.carts = JSON.parse(read_carts);
        this.current_id = Object.keys(this.carts)[Object.keys(this.carts).length - 1];
    }

    getProducts() {
        if (this.current_id >= 1) {
            return this.carts;
        } else {
            return undefined;
        }
    }

    addCart() {
        let ids = [];
        Object.entries(this.carts).forEach((carrito) => {
            ids.push(carrito[0]);
        });

        let max = Math.max(...ids);

        if (max == '-Infinity') {
            max = 0;
        }

        let this_cart = {};

        let cid = max + 1;
        this.carts[cid] = this_cart;

        fs.writeFileSync(path.join(this.file_path, this.file), JSON.stringify(this.carts, null, 2), 'utf-8', finished);
        return resp;
    }

    addItemToCart(cid, pid, qty) {
        if (this.carts[cid] == undefined) {
            resp = 9101;
            return resp;
        }

        let done = false;

        Object.entries(this.carts[cid]['products']).forEach((prod) => {
            let qtyToAdd = 0;
            if (prod[1]['product'] == pid) {
                let current_qty = prod[1]['quantity'];
                qtyToAdd = qty + current_qty;
                prod[1]['quantity'] = qtyToAdd;
                done = true;
            }
        });

        if (!done) {
            let new_prod = { product: Number(pid), quantity: qty };
            this.carts[cid]['products'].push(new_prod);
        }

        fs.writeFileSync(path.join(this.file_path, this.file), JSON.stringify(this.carts, null, 2), 'utf-8', finished);
        return resp;
    }
}


exports.getProducts = (req, res) => {
    const productsManager = new ProductsManager();
    const products = productsManager.getProducts();

    if (products) {
        res.json(products);
    } else {
        res.status(404).send('No hay productos disponibles.');
    }
};

exports.getProduct = (req, res) => {
    const productsManager = new ProductsManager();
    const productId = parseInt(req.params.pid);
    const products = productsManager.getProducts();

    if (products && products[productId]) {
        res.json(products[productId]);
    } else {
        res.status(404).send('Producto no encontrado.');
    }
};

exports.postProduct = (req, res) => {
    const productsManager = new ProductsManager();
    const { title, description, code, price, status, stock, category, thumbnails } = req.body;
    const responseCode = productsManager.addProduct(title, description, code, price, status, stock, category, thumbnails);

    res.status(responseCode).json({ code: responseCode, message: codes_translator(responseCode) });
};

exports.putProduct = (req, res) => {
    const productsManager = new ProductsManager();
    const productId = parseInt(req.params.pid);
    const { title, description, code, price, status, stock, category, thumbnails } = req.body;
    const responseCode = productsManager.editProduct(productId, title, description, code, price, status, stock, category, thumbnails);

    res.status(responseCode).json({ code: responseCode, message: codes_translator(responseCode) });
};

exports.deleteProduct = (req, res) => {
    const productsManager = new ProductsManager();
    const productId = parseInt(req.params.pid);
    const responseCode = productsManager.deleteProduct(productId);

    res.status(responseCode).json({ code: responseCode, message: codes_translator(responseCode) });
};

exports.postCart = (req, res) => {
    const cartsManager = new CartsManager();
    const responseCode = cartsManager.addCart();

    res.status(responseCode).json({ code: responseCode, message: codes_translator(responseCode) });
};

exports.getCartProducts = (req, res) => {
    const cartsManager = new CartsManager();
    const cartId = parseInt(req.params.cid);
    const carts = cartsManager.getProducts(); // Cambiar getCarts a getProducts

    if (carts && carts[cartId]) {
        res.json(carts[cartId].products); // Asumiendo que hay una propiedad 'products' en cada carrito
    } else {
        res.status(404).send('Carrito no encontrado o vacío.');
    }
};

exports.postProductToCart = (req, res) => {
    const cartsManager = new CartsManager();
    const { cid, pid, quantity } = req.body;
    const responseCode = cartsManager.addItemToCart(cid, pid, quantity);

    res.status(responseCode).json({ code: responseCode, message: codes_translator(responseCode) });
};
