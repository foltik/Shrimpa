--
-- Table structure for table `files`
--

CREATE TABLE `files` (
  `id` int(10) unsigned NOT NULL auto_increment,
  `hash` char(40) default NULL,
  `originalname` varchar(255) default NULL,
  `filename` varchar(30) default NULL,
  `user` varchar(255) default NULL,
  `size` int(10) unsigned default NULL,
  `date` date default NULL,
  `expire` date default NULL,
  `delid` char(40) default NULL,
  `dir` int(2) default '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB;
-- `filename` length (30) may be a bit excessive, since the average length would be smaller
-- [6 for the name + the file extension length], but since there is no limit for the file
-- extension length (at the moment, at least) let's keep it high in order to avoid problems

--
-- Table structure for table `accounts`
--

CREATE TABLE `accounts` (
  `id` int(10) unsigned NOT NULL auto_increment,
  `user` varchar(255) NOT NULL,
  `pass` varchar(255) NOT NULL,
  `apikey` varchar(255) NOT NULL,
  `level` int(11) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB;

--
-- Table structure for table `invites`
--

CREATE TABLE `invites` (
  `id` int(10) unsigned NOT NULL auto_increment,
  `code` varchar(50) default '0',
  `used` int(11) default '0',
  `level` int(11) default NULL,
  `issuer` varchar(255) NOT NULL default '0',
  `usedby` varchar(255) default NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB;

--
-- Table structure for table `reports`
--

CREATE TABLE `reports` (
  `id` int(10) unsigned NOT NULL auto_increment,
  `hash` char(40) default '0',
  `date` date default NULL,
  `file` varchar(255) NOT NULL default '0',
  `fileid` int(11) default '0',
  `reporter` varchar(255) NOT NULL default '0',
  `status` int(11) default '0',
  `reason` varchar(255) NOT NULL default '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB;