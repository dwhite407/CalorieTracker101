CREATE TABLE User(
	id int NOT NULL,
	username varchar(255) NOT NULL,
	password varchar(255) NOT NULL,
	email varchar(255) NOT NULL,
	PRIMARY KEY (id)
)

CREATE TABLE Summary(
	id int NOT NULL,
	user_id int NOT NULL,
	day date NOT NULL,
	calorie_goal integer NOT NULL,
	PRIMARY KEY (id),
	FOREIGN KEY (user_id) REFERENCES User(id)
)

CREATE TABLE Food(
	id integer NOT NULL,
	name varchar(255) NOT NULL,
	calories int NOT NULL,
	PRIMARY KEY (id)
)

CREATE TABLE Summary_Details(
	summary_id integer NOT NULL,
	food_id integer NOT NULL,
	quantity integer NOT NULL,
	PRIMARY KEY (summary_id, food_id),
	FOREIGN KEY (summary_id) REFERENCES  Summary(id),
	FOREIGN KEY (food_id) REFERENCES Food(id)
)
