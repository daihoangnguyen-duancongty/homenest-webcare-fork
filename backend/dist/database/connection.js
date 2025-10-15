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
exports.prisma = void 0;
const prisma_1 = require("../generated/prisma");
exports.prisma = null;
if (process.env.SKIP_DB !== 'true') {
    exports.prisma = new prisma_1.PrismaClient({
        log: ['query', 'info', 'warn', 'error'], // giúp debug
    });
    (() => __awaiter(void 0, void 0, void 0, function* () {
        try {
            yield exports.prisma.$connect();
            console.log('✅ Kết nối PostgreSQL (Supabase) bằng Prisma thành công!');
        }
        catch (error) {
            console.error('❌ Lỗi kết nối PostgreSQL:', error.message);
        }
    }))();
}
else {
    console.log('⚠️ SKIP_DB=true → Bỏ qua kết nối database (Prisma không được khởi tạo)');
}
