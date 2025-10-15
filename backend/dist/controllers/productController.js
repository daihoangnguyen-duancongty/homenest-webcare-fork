"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteProduct = exports.updateProduct = exports.addProduct = exports.getProductById = exports.getProducts = void 0;
const connection_1 = require("../database/connection");
// ======================= Lấy tất cả sản phẩm =======================
const getProducts = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { search } = req.query;
        let filter = {};
        if (search) {
            filter.name = { contains: String(search), mode: 'insensitive' };
        }
        const products = yield connection_1.prisma.product.findMany({
            where: filter,
            orderBy: { createdAt: 'desc' },
        });
        res.status(200).json(products);
    }
    catch (error) {
        console.error('❌ Lỗi khi lấy sản phẩm:', error);
        res.status(500).json({ message: 'Lỗi server' });
    }
});
exports.getProducts = getProducts;
// ======================= Lấy sản phẩm theo ID =======================
const getProductById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    if (!id) {
        res.status(400).json({ message: 'Thiếu ID sản phẩm' });
        return;
    }
    try {
        const product = yield connection_1.prisma.product.findUnique({ where: { id } });
        if (!product) {
            res.status(404).json({ message: 'Không tìm thấy sản phẩm' });
            return;
        }
        res.status(200).json(product);
    }
    catch (error) {
        res.status(500).json({ message: 'Lỗi server khi lấy sản phẩm' });
    }
});
exports.getProductById = getProductById;
// ======================= Thêm sản phẩm mới =======================
const addProduct = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { name, type, price, discount, profit, source, way } = req.body;
        const image = req.file;
        if (!name || !price || !image) {
            res.status(400).json({ message: 'Thiếu thông tin bắt buộc: name, price, image' });
            return;
        }
        const existing = yield connection_1.prisma.product.findUnique({
            where: { name: name.trim().toLowerCase() },
        });
        if (existing) {
            res.status(400).json({ message: 'Sản phẩm đã tồn tại' });
            return;
        }
        const product = yield connection_1.prisma.product.create({
            data: {
                name: name.trim().toLowerCase(),
                type: type === null || type === void 0 ? void 0 : type.trim(),
                price: parseFloat(price),
                discount: discount === null || discount === void 0 ? void 0 : discount.trim(),
                profit: profit === null || profit === void 0 ? void 0 : profit.trim(),
                source: source === null || source === void 0 ? void 0 : source.trim(),
                way: way === null || way === void 0 ? void 0 : way.trim(),
                imagePath: image.path,
                imageName: image.filename,
                imageOriginal: image.originalname,
            },
        });
        res.status(201).json({ message: 'Thêm sản phẩm thành công', product });
    }
    catch (error) {
        console.error('❌ Lỗi khi thêm sản phẩm:', error);
        res.status(500).json({ message: 'Lỗi server khi thêm sản phẩm' });
    }
});
exports.addProduct = addProduct;
// ======================= Cập nhật sản phẩm =======================
const updateProduct = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const { name, type, price, discount, profit, source, way } = req.body;
    const image = req.file;
    if (!id) {
        res.status(400).json({ message: 'Thiếu ID sản phẩm' });
        return;
    }
    const data = {};
    if (name)
        data.name = name.trim().toLowerCase();
    if (type)
        data.type = type.trim();
    if (price)
        data.price = parseFloat(price);
    if (discount)
        data.discount = discount.trim();
    if (profit)
        data.profit = profit.trim();
    if (source)
        data.source = source.trim();
    if (way)
        data.way = way.trim();
    if (image) {
        data.imagePath = image.path;
        data.imageName = image.filename;
        data.imageOriginal = image.originalname;
    }
    try {
        const product = yield connection_1.prisma.product.update({
            where: { id },
            data,
        });
        res.status(200).json({ message: 'Cập nhật thành công', product });
    }
    catch (error) {
        console.error('❌ Lỗi khi cập nhật sản phẩm:', error);
        res.status(500).json({ message: 'Lỗi server khi cập nhật sản phẩm' });
    }
});
exports.updateProduct = updateProduct;
// ======================= Xoá sản phẩm =======================
const deleteProduct = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    if (!id) {
        res.status(400).json({ message: 'Thiếu ID sản phẩm' });
        return;
    }
    try {
        yield connection_1.prisma.product.delete({ where: { id } });
        res.status(200).json({ message: 'Xoá sản phẩm thành công' });
    }
    catch (error) {
        console.error('❌ Lỗi khi xoá sản phẩm:', error);
        res.status(500).json({ message: 'Lỗi server khi xoá sản phẩm' });
    }
});
exports.deleteProduct = deleteProduct;
