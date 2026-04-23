# 黑客松海报生成器 TODO

## 资源准备
- [x] PDF底图转PNG预览图 (1100x1648)
- [x] 上传poster_bg.png -> /manus-storage/poster_bg_1841a9bb.png
- [x] 上传poster_template.pdf -> /manus-storage/poster_template_f528c87f.pdf

## 后端
- [x] 安装pymupdf依赖用于PDF生成
- [x] 实现 POST /api/generate-poster 接口（接收5条数据+图片，返回填写完成的PDF）
- [x] 图片上传接口（base64内嵌在请求体中）

## 前端
- [x] 全局样式：深色科技感主题，左右分栏布局
- [x] 页面标题「黑客松海报生成器」+ 副标题「去探索AI · 行知百城千县行动计划」
- [x] 左侧Canvas实时预览区（以poster_bg.png为底图）
- [x] 右侧控制面板：头像上传、称呼输入、家乡输入、三个问题输入
- [x] Canvas叠加渲染：图片区域、INFORMATION文字、三个答案文字
- [x] 图片缩放滑块（缩放比例控制）
- [x] 图片平移拖拽（水平/垂直偏移）+ 滑块控制
- [x] 恢复默认按钮
- [x] 右侧参数变化实时更新左侧Canvas
- [x] 下载PDF按钮（调用后端API）

## 测试
- [x] 后端PDF生成API单元测试（3个测试用例全部通过）
- [x] 前端Canvas渲染逻辑测试（auth测试通过）

## 功能变更
- [x] 将下载PDF改为导出PNG图片（直接从Canvas高清导出，无需后端）

## 海报更新（最新版）
- [x] 将底图替换为最新PDF转换的PNG (poster_bg_latest_baf0124a.png)
- [x] 精确校准新海报各区域坐标（图片框、INFORMATION框、三个答案框）
- [x] 更新Canvas底图URL和坐标常量
