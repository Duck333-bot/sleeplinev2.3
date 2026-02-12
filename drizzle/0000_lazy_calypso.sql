CREATE TABLE IF NOT EXISTS `checkIns` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`date` varchar(10) NOT NULL,
	`sleepHours` float NOT NULL,
	`sleepQuality` int NOT NULL,
	`morningEnergy` int NOT NULL,
	`caffeineToday` boolean NOT NULL DEFAULT false,
	`stressLevel` int NOT NULL,
	`workload` varchar(20) NOT NULL DEFAULT 'moderate',
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `checkIns_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `dayPlans` (
	`id` int AUTO_INCREMENT NOT NULL,
	`planId` varchar(64) NOT NULL,
	`userId` int NOT NULL,
	`date` varchar(10) NOT NULL,
	`tasks` json NOT NULL,
	`systemBlocks` json NOT NULL,
	`sleepOptions` json NOT NULL,
	`selectedSleepOptionId` varchar(64),
	`warnings` json,
	`appliedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `dayPlans_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `onboardings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`sleepGoalHrs` float NOT NULL DEFAULT 8,
	`preferredBedtime` varchar(10) NOT NULL DEFAULT '22:30',
	`preferredWakeTime` varchar(10) NOT NULL DEFAULT '06:30',
	`chronotype` varchar(20) NOT NULL DEFAULT 'flexible',
	`caffeineAfter3pm` boolean NOT NULL DEFAULT false,
	`breakFrequency` varchar(20) NOT NULL DEFAULT 'every-60m',
	`snackWindows` boolean NOT NULL DEFAULT true,
	`goals` json,
	`completedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `onboardings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `reminderSettings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`windDownReminder` boolean NOT NULL DEFAULT true,
	`windDownMinsBefore` int NOT NULL DEFAULT 30,
	`bedtimeReminder` boolean NOT NULL DEFAULT true,
	`nextTaskReminder` boolean NOT NULL DEFAULT false,
	`nextTaskMinsBefore` int NOT NULL DEFAULT 5,
	`quietHoursStart` int NOT NULL DEFAULT 1380,
	`quietHoursEnd` int NOT NULL DEFAULT 420,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `reminderSettings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `users` (
	`id` int AUTO_INCREMENT NOT NULL,
	`openId` varchar(64) NOT NULL,
	`name` text,
	`email` varchar(320),
	`loginMethod` varchar(64),
	`role` enum('user','admin') NOT NULL DEFAULT 'user',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`lastSignedIn` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_openId_unique` UNIQUE(`openId`)
);
