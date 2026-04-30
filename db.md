-- 1. 创建并使用数据库
CREATE DATABASE IF NOT EXISTS `did_db` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `did_db`;

-- 2. 用户表
CREATE TABLE `users` (
`id` INT PRIMARY KEY AUTO_INCREMENT,
`email` VARCHAR(100) NOT NULL UNIQUE COMMENT '登录邮箱',
`nickname` VARCHAR(50) DEFAULT 'New Learner' COMMENT '用户昵称',
`password_hash` VARCHAR(255) NOT NULL COMMENT 'Bcrypt加密后的哈希',
`coins` INT DEFAULT 0 COMMENT 'Coin数量', -- 取代原来的 points
`level` ENUM('A1', 'A2', 'B1', 'B2', 'C1', 'C2') DEFAULT 'A1' COMMENT '等级',
`total_questions` INT DEFAULT 0 COMMENT '做题总数 (点击submit的次数)' AFTER `level`,
`stamina` INT DEFAULT 100 COMMENT '当前体力值',
`max_stamina` INT DEFAULT 100 COMMENT '体力上限',
`last_stamina_update` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '体力最后一次变动时间',
`is_active` TINYINT(1) DEFAULT 0 COMMENT '邮箱是否验证成功: 0未验证, 1已验证',
`last_practice_date` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
`daily_questions_count` INT DEFAULT 0 COMMENT '今日已答题次数',
`daily_questions_date` DATE DEFAULT NULL COMMENT '答题计数日期',
`created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
`role` ENUM('USER', 'ADMIN') DEFAULT 'USER'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
-- 使用 utf8mb4 以支持 Emoji 物品和头像

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

-- 8. 物品表 (Emoji 掉落物)
CREATE TABLE `items` (
`id` INT PRIMARY KEY AUTO_INCREMENT,
`name` VARCHAR(50) NOT NULL,
`emoji` VARCHAR(20) NOT NULL COMMENT 'Emoji字符',
`type` ENUM('food', 'item') NOT NULL COMMENT 'food:恢复体力, item:可售卖物品',
`description` TEXT COMMENT '物品描述',
`recovery_value` INT DEFAULT 0 COMMENT '体力恢复值 (仅food有效)',
`sell_price` INT DEFAULT 0 COMMENT '售卖获得的Coin (food不可售卖则设为0)',
`buy_price` INT DEFAULT 0 COMMENT '商店买入价格',
`created_at` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. 收藏品表 (URL 资源)
CREATE TABLE `collections` (
`id` INT PRIMARY KEY AUTO_INCREMENT,
`name` VARCHAR(100) NOT NULL,
`category` ENUM('album', 'other', 'physical') NOT NULL,
`image_url` VARCHAR(255) COMMENT '封面或预览图URL',
`media_url` VARCHAR(255) COMMENT '核心资源(PDF/音频/动画)URL',
`buy_price` INT NOT NULL DEFAULT 0,
`description` TEXT,
`created_at` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 10. 用户背包表 (掉落物数量)
CREATE TABLE `user_inventory` (
`id` INT PRIMARY KEY AUTO_INCREMENT,
`user_id` INT NOT NULL,
`item_id` INT NOT NULL,
`quantity` INT DEFAULT 1,
FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
FOREIGN KEY (`item_id`) REFERENCES `items`(`id`) ON DELETE CASCADE,
UNIQUE KEY `idx_u_i` (`user_id`, `item_id`)
) ENGINE=InnoDB;

-- 11. 用户收藏夹表 (购买的Collections)
CREATE TABLE `user_collections` (
`id` INT PRIMARY KEY AUTO_INCREMENT,
`user_id` INT NOT NULL,
`collection_id` INT NOT NULL,
`purchased_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
FOREIGN KEY (`collection_id`) REFERENCES `collections`(`id`) ON DELETE CASCADE,
UNIQUE KEY `idx_u_c` (`user_id`, `collection_id`)
) ENGINE=InnoDB;

-- 12. 素材奖励配置表 (掉落概率)
CREATE TABLE `material_reward_configs` (
`id` INT PRIMARY KEY AUTO_INCREMENT,
`material_id` INT NOT NULL COMMENT '关联的素材ID',
`reward_type` ENUM('item', 'collection') NOT NULL COMMENT '奖励类型',
`reward_id` INT NOT NULL COMMENT '对应的 items 或 collections 的 ID',
`drop_rate` DECIMAL(5, 2) NOT NULL COMMENT '掉落概率 (0-100.00)',
`min_quantity` INT DEFAULT 1 COMMENT '最小掉落数量',
`max_quantity` INT DEFAULT 1 COMMENT '最大掉落数量',
FOREIGN KEY (`material_id`) REFERENCES `materials`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 13. 数据迁移 (2026-04-28)
ALTER TABLE `users` ADD COLUMN `daily_questions_count` INT DEFAULT 0 COMMENT '今日已答题次数' AFTER `last_practice_date`;
ALTER TABLE `users` ADD COLUMN `daily_questions_date` DATE DEFAULT NULL COMMENT '答题计数日期' AFTER `daily_questions_count`;
