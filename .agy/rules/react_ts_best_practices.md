---
name: react-ts-best-practices
description: Các nguyên tắc bắt buộc khi viết React Hooks và ép kiểu TypeScript
---

# 1. Không sử dụng kiểu "any"
- Tuyệt đối không dùng `any` để ép kiểu.
- Trong khối `try...catch`, không viết `catch (error: any)`, hãy viết `catch (error)` và ép kiểu an toàn bằng `(error as Error)?.message`.
- Khi lấy giá trị từ sự kiện (VD: select dropdown), ép kiểu về Strict Union type (VD: `as "all" | "7d"`) thay vì `any`.

# 2. Tránh Cascading Renders
- Tuyệt đối KHÔNG dùng `useEffect` chỉ để đồng bộ/reset các state cục bộ với nhau (như reset `currentPage` về 1 khi đổi bộ lọc). 
- Thay vào đó, hãy gọi lệnh cập nhật state trực tiếp bên trong Event Handler (`onChange`, `onClick`).

# 3. Chuẩn hóa Data Fetching khi component mount
- Đẩy toàn bộ logic gọi API vào thẳng bên trong `useEffect`. 
- Sử dụng cú pháp thuần Promise (`.then().catch()`) thay vì `async/await` để tránh bị ESLint bắt lỗi `set-state-in-effect`. 
- Luôn dùng biến cờ `let isMounted = true` và cleanup function `return () => { isMounted = false; }` để tránh lỗi Memory Leak nếu component unmount trước khi Promise giải quyết.

# 4. Sử dụng "const" thay cho "let" (prefer-const)
- Luôn dùng `const` thay vì `let` cho array/object, kể cả khi cần thay đổi dữ liệu bên trong bằng các hàm như `.sort()`, `.push()`, `.splice()`. 
- Chỉ dùng `let` khi thực sự cần gán một giá trị hoàn toàn mới bằng toán tử `=`.
