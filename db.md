-- 1. 创建并使用数据库
CREATE DATABASE IF NOT EXISTS `did_db` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `did_db`;

-- 2. 用户表
CREATE TABLE `users` (
`id` INT PRIMARY KEY AUTO_INCREMENT,
`username` VARCHAR(50) NOT NULL UNIQUE COMMENT '账号: 邮箱/手机号',
`nickname` VARCHAR(10) NOT NULL COMMENT '用户昵称',
`password` VARCHAR(255) NOT NULL COMMENT 'Bcrypt哈希密码',
`security_answer` VARCHAR(255) NOT NULL COMMENT '密保答案bcrypt哈希',
`points` DECIMAL(10, 1) DEFAULT 0.0 COMMENT '可用积分',
`current_level` ENUM('A1', 'A2', 'B1', 'B2', 'C1', 'C2') DEFAULT NULL COMMENT '当前动态等级',
`last_practice_date` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '最后一次练习时间',
`created_at` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 3. 素材表 (核心容器: 阅读/听力)
CREATE TABLE `materials` (
`id` INT PRIMARY KEY AUTO_INCREMENT,
`type` ENUM('reading', 'listening') NOT NULL COMMENT '素材类型',
`level` ENUM('A1', 'A2', 'B1', 'B2', 'C1', 'C2') NOT NULL COMMENT '难度分级',
`title` VARCHAR(255) NOT NULL,
`content` TEXT NOT NULL COMMENT '正文或听力脚本',
`media_url` VARCHAR(255) DEFAULT NULL COMMENT '听力音频路径(阅读为NULL)',
`image_url` VARCHAR(255) DEFAULT NULL COMMENT '素材配图路径',
`full_analysis` TEXT COMMENT '本素材下所有题目的统一解析文档',
`country` VARCHAR(255) DEFAULT '' COMMENT '国家/地区',
`topic` VARCHAR(255) DEFAULT '' COMMENT '主题分类',
`created_at` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 4. 题目表 (附属零件)
CREATE TABLE `questions` (
`id` INT PRIMARY KEY AUTO_INCREMENT,
`material_id` INT NOT NULL COMMENT '所属素材ID',
`q_type` ENUM('choice', 'bool', 'fill') NOT NULL COMMENT '选择/判断/填空',
`stem` TEXT NOT NULL COMMENT '题干',
`options` JSON DEFAULT NULL COMMENT '选项: ["A.xxx", "B.xxx"]',
`std_answer` VARCHAR(255) NOT NULL COMMENT '选择题存A, 判断题存T/F, 填空题存大写单词',
FOREIGN KEY (`material_id`) REFERENCES `materials`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 5. 用户收藏表 (按素材组件收藏)
CREATE TABLE `user_favorites` (
`id` INT PRIMARY KEY AUTO_INCREMENT,
`user_id` INT NOT NULL,
`material_id` INT NOT NULL COMMENT '收藏整个练习组件',
`created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
UNIQUE KEY `idx_u_m` (`user_id`, `material_id`),
FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
FOREIGN KEY (`material_id`) REFERENCES `materials`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 6. 练习历史与积分冷却表
CREATE TABLE `user_practice_history` (
`id` INT PRIMARY KEY AUTO_INCREMENT,
`user_id` INT NOT NULL,
`material_id` INT NOT NULL COMMENT '以素材组件为单位记录进度',
`last_done_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '显示: x天前做过',
`last_rewarded_at` DATETIME DEFAULT NULL COMMENT '上一次拿分时间: 实现1天冷却逻辑',
UNIQUE KEY `idx_u_m_h` (`user_id`, `material_id`),
FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
FOREIGN KEY (`material_id`) REFERENCES `materials`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 7. 积分变动流水表
CREATE TABLE `point_logs` (
`id` INT PRIMARY KEY AUTO_INCREMENT,
`user_id` INT NOT NULL,
`change_amount` DECIMAL(10, 1) NOT NULL,
`reason` VARCHAR(100) NOT NULL COMMENT '原因: A2阅读达标',
`created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB;
