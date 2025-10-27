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

User:tiennguyen@admin.com
Pass: tiennguyen1234

userid: 68feeddee4931d950230f744

"token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4ZmVlZGRlZTQ5MzFkOTUwMjMwZjc0NCIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTc2MTUzNzc3NSwiZXhwIjoxNzYyMTQyNTc1fQ.yJSaZjnv0OSEWeDYd18uY4d8QIPAXc3mOwTCIizg41M",

Admin:

User:verdhn@admin.com
Pass: admin0001

userid: 68feee68e4931d950230f749

"token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4ZmVlZTY4ZTQ5MzFkOTUwMjMwZjc0OSIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTc2MTUzNzc5OCwiZXhwIjoxNzYyMTQyNTk4fQ.DRixNWbopvt4PRisB7f10YXq9sbvCqvwm4JYtzZL_IY",

Telesale 4:

User:verdhntelesales4@example.com
Pass: telesale004

userid:68feeca0e4931d950230f73a

"token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4ZmVlY2EwZTQ5MzFkOTUwMjMwZjczYSIsInJvbGUiOiJ0ZWxlc2FsZSIsImlhdCI6MTc2MTUzNzgyOSwiZXhwIjoxNzYyMTQyNjI5fQ.BqAJfdUBPkSsUB8ZfC85QtHxUij-w5Pzdvb5hkHsK1w",

Telesale 6:

User:verdhntelesales6@example.com
Pass: telesale006

userid:68feecdce4931d950230f73f
"token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4ZmVlY2RjZTQ5MzFkOTUwMjMwZjczZiIsInJvbGUiOiJ0ZWxlc2FsZSIsImlhdCI6MTc2MTUzNzg2NCwiZXhwIjoxNzYyMTQyNjY0fQ.ZcQw7sON1P0BCe4rPh1TSz-mjetqMzqfZbDfhZg9B8c",


------Socket io:

B1: npm run dev de start backend

B2: test bang cach nhap Token va UserId vào

cd "C:\Users\Home Nest\OneDrive\Desktop\DU AN\DU AN HOMENEST-WEB CARE\homenest-webcar-main\backend\test"
node test-socket.js
