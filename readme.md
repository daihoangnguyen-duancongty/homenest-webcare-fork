Hướng dẫn lấy các thông tin trong file .env của backend

https://developers.zalo.me/docs/official-account/bat-dau/xac-thuc-va-uy-quyen-cho-ung-dung-new

---

-> Start local frontend

a/ Mở Dashboard-web

0/ C:\Users\Home Nest\OneDrive\Desktop\DU AN\DU AN HOMENEST-WEB CARE\homenest-webcar-main\dashboard-web>

1/ Mở Terminal (Commant Promt)

2/ chạy npm run dev

b/Mở Mini app

1/ Mở extension Zalo Mini App

2/ Chọn tab Phát triển

3/ Chọn chế độ muốn start

4/ Bấm Khởi động

-> Start local backend

1/ Mở Terminal (Commant Promt) : cd backend

2/ chạy npm run dev

-> kiểm tra ở GET http://localhost:5000/api/test-db

3/ tao entpoint tam de dan vao webhook zalo OA

1/ Mở Terminal -> C:\Users\Home Nest\OneDrive\Desktop\DU AN\DU AN HOMENEST-WEB CARE\homenest-webcar-main\backend>lt --port 5000

\*_\*\*nếu chưa có endpoit test tạm thì chạy lệnh để tạo mới Localtunnel: lt --port congbackend _

(endpoint test nay hieu luc trong 5-10p)
2/ copy link vừa được tạo ra dán vào webhook zalo OA

---

TEST

------User:

Admin:

User:verdhnadmin3@example.com
Pass: admin126

userid: 68edc52b8d8a13bb957d8cf3
"token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4ZWRjNTJiOGQ4YTEzYmI5NTdkOGNmMyIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTc2MDQxMzAxMCwiZXhwIjoxNzYxMDE3ODEwfQ.uUEXRJ4gPi0L3C8MRUVeEJzGiHF-pI1XFPrtl9WuGoI",

Telesale 4:

User:verdhntelesales4@example.com
Pass: telesale127

userid:68edc5fc8d8a13bb957d8cfa
"token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4ZWRjNWZjOGQ4YTEzYmI5NTdkOGNmYSIsInJvbGUiOiJ0ZWxlc2FsZSIsImlhdCI6MTc2MDQxMzI4NiwiZXhwIjoxNzYxMDE4MDg2fQ.FQPVW5SuQRywjTauJujDJv4JuHazbx5eLzTEK-tNoL0",

Telesale 6:

User:verdhntelesales6@example.com
Pass: telesale128

userid:68edc6388d8a13bb957d8cff
"token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4ZWRjNjM4OGQ4YTEzYmI5NTdkOGNmZiIsInJvbGUiOiJ0ZWxlc2FsZSIsImlhdCI6MTc2MDQxMzMxNCwiZXhwIjoxNzYxMDE4MTE0fQ.Q9lya3mj_6GFHY_TBLHi6Y7aTEuyCmSa7rwVluofk0s",

------Socket io:

B1: npm run dev de start backend

B2: test bang cach nhap Token va UserId vào

cd "C:\Users\Home Nest\OneDrive\Desktop\DU AN\DU AN HOMENEST-WEB CARE\homenest-webcar-main\backend\test"
node test-socket.js
