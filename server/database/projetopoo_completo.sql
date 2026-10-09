
/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

CREATE DATABASE /*!32312 IF NOT EXISTS*/ `projetopoo` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci */ /*!80016 DEFAULT ENCRYPTION='N' */;

USE `projetopoo`;
DROP TABLE IF EXISTS `administradores`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `administradores` (
  `id` int NOT NULL AUTO_INCREMENT,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `senha_hash` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `criado_em` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `profissional_id` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  KEY `fk_administrador_profissional` (`profissional_id`),
  CONSTRAINT `fk_administrador_profissional` FOREIGN KEY (`profissional_id`) REFERENCES `profissionais` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `administradores` WRITE;
/*!40000 ALTER TABLE `administradores` DISABLE KEYS */;
INSERT INTO `administradores` VALUES (1,'tavareslucas1213@gmail.com','0332a9e916c1580c414903379cf96c3c:de6412e78b5deef2527d477052995d9fa1a1addb0d1ecaeea268c32d305ec3f2e472b62fb8e41ddd094adce18fde2ff0a9852cc906e2641c76f363c11968ecb8','2026-10-03 18:56:47',NULL),(11,'tavareslorena15@gmail.com','d27e7fba3d415359b8c83e967a947c7e:eb71894e671fc395fcf37bb194015d3f833519b7df6bfba0dd7e553a86a2660c580bd539831e22565eab19cd558d69b2f438b060afd6f0809f040413f2ce353c','2026-10-06 12:52:11',6),(12,'jhuly@gmail.com','ef69eeee05068224fb336ba26853dafc:08e8f3729f98bb5e00ee7be48e1bc34e59d43909c701b0ef27fbc30a00b1c66ca8ab414c06fb2ebdb720cde6a59684fcba3e757e174b0fdbcd42b0660c20ef20','2026-10-06 13:08:44',9),(13,'alexandre18agos@gmail.com','861480cffd9c50945c2117e0656ba04f:fd9233083e42a907293eca7743e0067851344f0cfddcddf42de6f7029a09a9459a0d8fcb9bef6591ae53ccdc2500a3f8f53491765d2e524c602e237a63d6ac1b','2026-10-09 22:41:10',NULL);
/*!40000 ALTER TABLE `administradores` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `agendamento_tratamentos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `agendamento_tratamentos` (
  `agendamento_id` int NOT NULL,
  `tratamento_id` int NOT NULL,
  PRIMARY KEY (`agendamento_id`,`tratamento_id`),
  KEY `tratamento_id` (`tratamento_id`),
  CONSTRAINT `agendamento_tratamentos_ibfk_1` FOREIGN KEY (`agendamento_id`) REFERENCES `agendamentos` (`id`) ON DELETE CASCADE,
  CONSTRAINT `agendamento_tratamentos_ibfk_2` FOREIGN KEY (`tratamento_id`) REFERENCES `tratamentos` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `agendamento_tratamentos` WRITE;
/*!40000 ALTER TABLE `agendamento_tratamentos` DISABLE KEYS */;
INSERT INTO `agendamento_tratamentos` VALUES (7,10),(11,10),(19,10),(23,10),(7,11),(19,11),(18,12),(20,12);
/*!40000 ALTER TABLE `agendamento_tratamentos` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `agendamentos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `agendamentos` (
  `id` int NOT NULL AUTO_INCREMENT,
  `cliente_id` int NOT NULL,
  `profissional_id` int NOT NULL,
  `data` date NOT NULL,
  `hora_inicio` time NOT NULL,
  `status` enum('AGENDADO','EM_ATENDIMENTO','FINALIZADO') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'AGENDADO',
  `criado_em` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `arquivado` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `cliente_id` (`cliente_id`),
  KEY `profissional_id` (`profissional_id`),
  CONSTRAINT `agendamentos_ibfk_1` FOREIGN KEY (`cliente_id`) REFERENCES `clientes` (`id`),
  CONSTRAINT `agendamentos_ibfk_2` FOREIGN KEY (`profissional_id`) REFERENCES `profissionais` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=24 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `agendamentos` WRITE;
/*!40000 ALTER TABLE `agendamentos` DISABLE KEYS */;
INSERT INTO `agendamentos` VALUES (7,7,6,'2026-10-05','09:30:00','FINALIZADO','2026-10-03 19:06:24',1),(11,11,6,'2026-10-06','09:30:00','FINALIZADO','2026-10-06 01:53:42',1),(18,18,9,'2026-10-07','10:00:00','AGENDADO','2026-10-06 13:07:42',0),(19,19,6,'2026-10-07','09:00:00','AGENDADO','2026-10-06 13:14:52',0),(20,20,9,'2026-10-07','11:30:00','AGENDADO','2026-10-06 13:15:26',0),(23,23,6,'2026-10-09','11:30:00','AGENDADO','2026-10-08 13:05:04',0);
/*!40000 ALTER TABLE `agendamentos` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `clientes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `clientes` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nome` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `telefone` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=24 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `clientes` WRITE;
/*!40000 ALTER TABLE `clientes` DISABLE KEYS */;
INSERT INTO `clientes` VALUES (4,'Fernanda Cliente','11955554444'),(6,'Lucas Tavares','98988445566'),(7,'Lorena tavares','98977886655'),(10,'Pedro','98966774455'),(11,'Victor','98955112233'),(12,'Karol','223355441155'),(13,'Enzo','(98) 95544-3322'),(14,'Gabriel','(98) 94433-5532'),(17,'Elayne','(98) 98778-6545'),(18,'João Pedro','(98) 95643-1232'),(19,'Cassiene','(98) 98878-7575'),(20,'Alaim','(98) 99110-1999'),(21,'Juliana','(98) 98464-9813'),(22,'juliana','(98) 98464-9813'),(23,'Clara','(98) 98464-9813');
/*!40000 ALTER TABLE `clientes` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `configuracoes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `configuracoes` (
  `chave` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `valor` text COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`chave`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `configuracoes` WRITE;
/*!40000 ALTER TABLE `configuracoes` DISABLE KEYS */;
INSERT INTO `configuracoes` VALUES ('acesso_publico_liberado','true');
/*!40000 ALTER TABLE `configuracoes` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `horarios_disponiveis`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `horarios_disponiveis` (
  `id` int NOT NULL AUTO_INCREMENT,
  `profissional_id` int NOT NULL,
  `dia_semana` tinyint NOT NULL,
  `hora_inicio` time NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_horario_profissional` (`profissional_id`,`dia_semana`,`hora_inicio`),
  CONSTRAINT `horarios_disponiveis_ibfk_1` FOREIGN KEY (`profissional_id`) REFERENCES `profissionais` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=75 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `horarios_disponiveis` WRITE;
/*!40000 ALTER TABLE `horarios_disponiveis` DISABLE KEYS */;
INSERT INTO `horarios_disponiveis` VALUES (14,6,1,'09:00:00'),(15,6,1,'09:30:00'),(16,6,1,'10:00:00'),(17,6,1,'10:30:00'),(18,6,1,'11:00:00'),(19,6,1,'11:30:00'),(21,6,1,'13:00:00'),(22,6,1,'13:30:00'),(23,6,1,'14:00:00'),(29,6,1,'14:30:00'),(30,6,1,'15:00:00'),(24,6,2,'09:00:00'),(31,6,2,'09:30:00'),(32,6,2,'10:00:00'),(33,6,2,'10:30:00'),(34,6,2,'11:00:00'),(35,6,2,'11:30:00'),(25,6,3,'09:00:00'),(54,6,3,'09:30:00'),(55,6,3,'10:00:00'),(57,6,3,'10:30:00'),(58,6,3,'11:00:00'),(59,6,3,'11:30:00'),(26,6,4,'09:00:00'),(60,6,4,'09:30:00'),(61,6,4,'10:00:00'),(62,6,4,'10:30:00'),(63,6,4,'11:00:00'),(64,6,4,'11:30:00'),(27,6,5,'09:00:00'),(65,6,5,'09:30:00'),(66,6,5,'10:00:00'),(67,6,5,'10:30:00'),(68,6,5,'11:00:00'),(69,6,5,'11:30:00'),(28,6,6,'09:00:00'),(70,6,6,'09:30:00'),(71,6,6,'10:00:00'),(72,6,6,'10:30:00'),(73,6,6,'11:00:00'),(74,6,6,'11:30:00'),(36,9,2,'09:00:00'),(37,9,2,'09:30:00'),(38,9,2,'10:00:00'),(39,9,2,'10:30:00'),(40,9,2,'11:00:00'),(41,9,2,'11:30:00'),(42,9,3,'09:00:00'),(43,9,3,'09:30:00'),(44,9,3,'10:00:00'),(45,9,3,'10:30:00'),(46,9,3,'11:00:00'),(47,9,3,'11:30:00'),(48,9,4,'09:00:00'),(49,9,4,'09:30:00'),(50,9,4,'10:00:00'),(51,9,4,'10:30:00'),(52,9,4,'11:00:00'),(53,9,4,'11:30:00');
/*!40000 ALTER TABLE `horarios_disponiveis` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `profissionais`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `profissionais` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nome` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `telefone` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `especialidade` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `profissionais` WRITE;
/*!40000 ALTER TABLE `profissionais` DISABLE KEYS */;
INSERT INTO `profissionais` VALUES (6,'Lorena Benvindo','98984649813','Sobrancelha'),(9,'Jhully Silva','98965348871','Fisioterapia');
/*!40000 ALTER TABLE `profissionais` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `tratamentos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tratamentos` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nome` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `descricao` text COLLATE utf8mb4_unicode_ci,
  `valor` decimal(10,2) NOT NULL,
  `duracao_minutos` int NOT NULL,
  `profissional_id` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_tratamento_profissional` (`profissional_id`),
  CONSTRAINT `fk_tratamento_profissional` FOREIGN KEY (`profissional_id`) REFERENCES `profissionais` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `tratamentos` WRITE;
/*!40000 ALTER TABLE `tratamentos` DISABLE KEYS */;
INSERT INTO `tratamentos` VALUES (10,'sobrancelha com rena','',35.00,30,6),(11,'Limpeza de Pele','',250.00,60,6),(12,'Fisioterapia de Pernas','',50.00,30,9);
/*!40000 ALTER TABLE `tratamentos` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

