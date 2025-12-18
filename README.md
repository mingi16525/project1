# Game Web Application - Pathfinding Visualizer

Ứng dụng web game tìm đường thông minh với React frontend và Spring Boot backend. Hỗ trợ 4 thuật toán tìm đường: BFS, DFS, A*, và IDS với visualization đầy đủ.

## 🎮 Tính năng

### Core Features
- ✅ **Tạo và chỉnh sửa map tùy chỉnh** - Map0 với kích thước n×m tùy ý
- ✅ **Chỉnh sửa map tương tác** - Thêm điểm xuất phát (x), chướng ngại vật (1), điểm kết thúc (y)
- ✅ **4 thuật toán tìm đường**:
  - **BFS** (Breadth-First Search) - Tìm đường đi ngắn nhất
  - **DFS** (Depth-First Search) - Duyệt theo chiều sâu
  - **A*** (A-Star) - Tìm đường tối ưu với heuristic Manhattan
  - **IDS** (Iterative Deepening Search) - Duyệt lặp tăng dần độ sâu

### Visualization
- 🎬 **Animation di chuyển** - Mario di chuyển theo đường đi với animation nhấp nháy và nổi
- 📊 **Hiển thị lịch sử duyệt node** - Xem quá trình thuật toán khám phá các node theo thời gian thực
- ⚡ **Điều khiển tốc độ** - Slider điều chỉnh tốc độ animation từ 10ms đến 500ms
- 🔄 **Phát lại lịch sử** - Xem lại quá trình duyệt node của thuật toán
- 📈 **Thống kê chi tiết**:
  - Độ dài đường đi
  - Số node đã duyệt
  - Thời gian thực thi (ms)

### Visual Elements
- 🎨 **Mario.jpeg** - Điểm xuất phát và nhân vật di chuyển
- 💎 **Diamond.jpg** - Điểm đích
- 🟥 **Màu đỏ** - Chướng ngại vật
- 🔵 **Màu xanh dương** - Đường đi tìm được
- ⚪ **Màu xám mờ** - Node đã được duyệt

## 📁 Cấu trúc dự án

```
game-webapp/
├── backend/                    # Spring Boot REST API
│   ├── src/
│   │   └── main/
│   │       ├── java/com/game/
│   │       │   ├── GameApplication.java
│   │       │   ├── config/
│   │       │   │   └── CorsConfig.java
│   │       │   ├── controller/
│   │       │   │   ├── MapController.java
│   │       │   │   ├── PathFindingController.java
│   │       │   │   └── ImageController.java
│   │       │   ├── model/
│   │       │   │   ├── GameMap.java
│   │       │   │   ├── Position.java
│   │       │   │   ├── PathFindingRequest.java
│   │       │   │   └── PathFindingResponse.java
│   │       │   └── service/
│   │       │       ├── MapService.java
│   │       │       └── PathFindingService.java
│   │       └── resources/
│   │           └── application.properties
│   ├── data/
│   │   ├── maps/              # Text files: Map1.txt, Map2.txt
│   │   └── img/               # Images: mario.jpeg, diamond.jpg
│   └── pom.xml
└── frontend/                   # React Application
    ├── src/
    │   ├── components/
    │   │   ├── GameBoard.js   # Main game board component
    │   │   ├── GameBoard.css
    │   │   ├── MapList.js     # Map selection
    │   │   └── MapList.css
    │   ├── services/
    │   │   ├── api.js         # Axios API client
    │   │   └── PlayerMovement.js  # Animation logic
    │   ├── App.js
    │   ├── App.css
    │   ├── index.js
    │   └── index.css
    ├── public/
    │   └── index.html
    └── package.json
```

## 🛠️ Yêu cầu

- **Java** 17+ (Đã test với Java 21.0.9)
- **Maven** 3.6+ (Đã test với Maven 3.9.9)
- **Node.js** 14+ (Khuyến nghị 16+)
- **npm** hoặc **yarn**

## 🚀 Cài đặt và chạy

### Backend (Spring Boot)

```bash
cd backend
# Thiết lập Maven PATH (Windows PowerShell)
$env:PATH += ";$env:USERPROFILE\maven\apache-maven-3.9.9\bin"

# Build project
mvn clean compile package -DskipTests

# Chạy server
mvn spring-boot:run
```

Server sẽ chạy tại: **http://localhost:8080**

### Frontend (React)

```bash
cd frontend
# Cài đặt dependencies
npm install

# Chạy development server
npm start
```

Application sẽ chạy tại: **http://localhost:3000**

## 📡 API Endpoints

### Map APIs
- `GET /api/maps` - Lấy danh sách tất cả maps
- `GET /api/maps/{id}` - Lấy thông tin map theo ID

### Pathfinding API
- `POST /api/pathfinding` - Tìm đường đi với thuật toán được chọn
  ```json
  Request Body:
  {
    "tiles": [["0", "1", "x"], ["0", "0", "0"], ["y", "1", "0"]],
    "width": 3,
    "height": 3,
    "algorithm": "BFS" // BFS | DFS | A_STAR | IDS
  }
  
  Response:
  {
    "path": [{"row": 0, "col": 2}, {"row": 1, "col": 2}, ...],
    "found": true,
    "nodesExplored": 15,
    "executionTime": 2,
    "algorithm": "BFS",
    "visitedNodes": [{"row": 0, "col": 0}, ...]
  }
  ```

### Image API
- `GET /api/images/{filename}` - Lấy ảnh từ thư mục data/img/
  - `mario.jpeg` - Hình Mario
  - `diamond.jpg` - Hình kim cương

## 🎯 Hướng dẫn sử dụng

### 1. Tạo Map mới (Map0)
- Chọn "Map 0" từ danh sách
- Nhập kích thước n (chiều cao) và m (chiều rộng)
- Click "Tạo Map"

### 2. Chỉnh sửa Map
- **Thêm điểm xuất phát (x)**: Click button "Thêm điểm xuất phát" → Click vào ô trên map
- **Thêm chướng ngại (1)**: Click button "Thêm chướng ngại" → Click vào ô (toggle on/off)
- **Thêm điểm kết thúc (y)**: Click button "Thêm điểm kết thúc" → Click vào ô

### 3. Chạy thuật toán
- Click một trong 4 button thuật toán: BFS, DFS, A*, IDS
- Hệ thống sẽ tự động:
  1. Hiển thị animation các node được duyệt (nếu bật)
  2. Di chuyển Mario theo đường đi tìm được
  3. Hiển thị thống kê (độ dài, số node, thời gian)

### 4. Điều khiển Visualization
- **"Hiện lịch sử duyệt"**: Toggle hiển thị các node đã được thuật toán duyệt qua
- **"Phát lại lịch sử"**: Xem lại animation quá trình duyệt node
- **Slider tốc độ**: Điều chỉnh tốc độ animation (10-500ms)
- **"Dừng"**: Dừng animation đang chạy
- **"Reset"**: Xóa đường đi và quay về trạng thái ban đầu

## 🧩 Thuật toán

### BFS (Breadth-First Search)
- Duyệt theo chiều rộng
- **Đảm bảo** tìm được đường đi **ngắn nhất**
- Sử dụng Queue (FIFO)
- Phù hợp với: Map đơn giản, cần đường đi ngắn nhất

### DFS (Depth-First Search)
- Duyệt theo chiều sâu
- **Không đảm bảo** đường đi ngắn nhất
- Sử dụng Stack/Recursion (LIFO)
- Phù hợp với: Khám phá toàn bộ không gian

### A* (A-Star)
- Thuật toán tìm kiếm **tối ưu** với heuristic
- Sử dụng **Manhattan Distance** (|x1-x2| + |y1-y2|)
- Priority Queue với f(n) = g(n) + h(n)
- Phù hợp với: Cần hiệu suất cao, đường đi tối ưu

### IDS (Iterative Deepening Search)
- Kết hợp ưu điểm BFS và DFS
- Duyệt lặp với độ sâu tăng dần (0, 1, 2, 3, ...)
- Đảm bảo tìm được đường đi ngắn nhất
- Phù hợp với: Không gian tìm kiếm lớn, giới hạn bộ nhớ

## 🏗️ Kiến trúc kỹ thuật

### Backend Stack
- **Framework**: Spring Boot 3.2.0
- **Java Version**: 17
- **Build Tool**: Maven 3.9.9
- **Libraries**: 
  - Spring Web (REST API)
  - Lombok (Boilerplate reduction)
- **Data Storage**: File-based (text files, no database)

### Frontend Stack
- **Framework**: React 18.2.0
- **HTTP Client**: Axios 1.6.0
- **Build Tool**: react-scripts 5.0.1
- **Styling**: CSS Modules

### Key Classes

#### Backend
- `PathFindingService.java` - Chứa 4 thuật toán tìm đường
- `PlayerMovement.java` (Frontend) - Xử lý animation di chuyển
- `MapService.java` - Quản lý load map từ file
- `ImageController.java` - Serve static images

#### Frontend
- `GameBoard.js` - Component chính, xử lý UI và logic
- `MapList.js` - Component chọn map
- `PlayerMovement.js` - Class xử lý animation
- `api.js` - Axios client cho REST API calls

## 📊 Format dữ liệu Map

```
5 10
0000000000
0111111110
0x00000010
0000011110
000000000y
```

- **Dòng 1**: `height width` (chiều cao × chiều rộng)
- **Các dòng tiếp theo**: Grid data
  - `0`: Ô rỗng (trắng)
  - `1`: Chướng ngại vật (đỏ)
  - `x`: Điểm xuất phát (Mario)
  - `y`: Điểm kết thúc (Diamond)

## 🎨 Giao diện

### Màu sắc
- **Background**: #16213e (Dark blue)
- **Buttons**: Gradient colors (Purple, Pink, Blue, Green)
- **Blocked tiles**: #ff0000 (Red)
- **Start tile**: #90EE90 (Light green)
- **End tile**: #FFD700 (Gold)
- **Path**: #87CEEB (Sky blue)
- **Visited nodes**: rgba(192,192,192,0.5) (Gray with diagonal stripes)

### Animations
- **playerBlink**: Opacity và scale thay đổi (0.6s)
- **playerFloat**: Di chuyển lên/xuống (1s)
- **visitedFadeIn**: Fade in và scale khi node xuất hiện (0.3s)
- **pathPulse**: Pulse effect cho đường đi (1s)

## 🐛 Troubleshooting

### Backend không start
```bash
# Kiểm tra Java version
java -version  # Phải >= 17

# Kiểm tra Maven
mvn -version

# Build lại project
mvn clean install
```

### Frontend không kết nối được Backend
- Kiểm tra Backend đang chạy tại port 8080
- Kiểm tra CORS configuration trong `CorsConfig.java`
- Xem Console browser để debug lỗi network

### Ảnh không hiển thị
- Kiểm tra file tồn tại: `backend/data/img/mario.jpeg` và `diamond.jpg`
- Kiểm tra `ImageController.java` đã được build
- Restart backend server

## 📝 Notes

- Project **không sử dụng database**, tất cả data lưu trong text files
- Map chỉnh sửa **không được lưu vĩnh viễn**, reload sẽ reset về map gốc
- Animation speed có thể điều chỉnh realtime qua slider
- Tất cả 4 thuật toán đều track visited nodes để visualization

## 🔮 Future Enhancements

- [ ] Thêm thuật toán Dijkstra, Greedy Best-First Search
- [ ] Lưu map vào database (MongoDB/PostgreSQL)
- [ ] Export/Import map dưới dạng JSON
- [ ] Thêm nhiều theme và character khác
- [ ] Multiplayer mode
- [ ] Leaderboard cho đường đi tối ưu nhất
- [ ] Dark/Light mode toggle

## 📄 License

Dự án học tập - 2025

## 👨‍💻 Developer

Game Web Application - Pathfinding Visualizer
Version: 1.0.0
Date: November 2025
