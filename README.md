# Project Setup on your local machine

## Installation and Steps

### For Windows Users

#### Installations
#### 1. Install MySQL Installer for Windows
#### 2. Install Node.js Windows installer
#### 3. Install Python 3.11 from microsoft store or official website

#### Backend setup 
#### 1. Create a empty MySQL database in the workbench after installing
#### 2. Within backend folder… inside the ‘.env’ file… enter the credentials of your newly created empty database from the previous step
#### 3. Open your command prompt (not terminal) and change directory to the path of the backend folder itself so run: cd ‘path of backend folder’ .. easiest way is just to copy the path of backend folder with a right click
#### 4. Once you’re in the backend folder directory, enter/activate the virtual environment by entering the command line: ‘.\env\Scripts\activate’
#### 5. So now run the following command: ‘python manage.py migrate’ .. this will apply all of the pending migrations to your MySQL database.
#### 6. So now you’ll need to run the development web server on your local machine using django but before you do that you may need to create a superuser if you don't have one
#### 7. To create a superuser run the command: ‘python manage.py createsuperuser’ and follow the instructions to create one.
#### 8. Once the superuser you now use those credentials (username and password) to login into django’s Admin page but before logging in you need to run the server so that’s in the next step
#### 9. So now that you have the superuser created you can now enter the following command to run the development server so that you can use django’s admin page for your database uses: ‘python manage.py runserver’
#### 10. Once the server is running, To access the Django admin page interface, go to http://localhost:8000/admin/ in your web browser

#### Frontend Setup
#### 1. Open your Terminal (not command prompt) and change directory to the frontend folder path
#### 2. So run: cd ‘path to frontend folder’
#### 3. Once your in that frontend folder directory run the project by typing the following line; ‘npm start’
#### 4. You should be able to see the web app in a local host on your web browser now


### For Mac Users 

#### Installation
#### 1. Install MySQL: Download and install MySQL for Mac from the official MySQL website.
#### 2. Install Node.js: Download and install Node.js for Mac from the official Node.js website.
#### 3. Install Python: Download and install Python for Mac from the Python official website or use Homebrew (brew install python).

#### Backend Setup 
#### 1. Create an empty MySQL database using MySQL Workbench or Terminal.
#### 2. In the backend folder, edit the .env file to enter the credentials of the newly created database.
#### 3. Open Terminal and change the directory to the backend folder using cd path/to/backend.
#### 4. Activate the virtual environment: source env/bin/activate.
#### 5. Apply migrations to the MySQL database: python manage.py migrate.
#### 6. Create a Django superuser: python manage.py createsuperuser.
#### 7. Run the Django development server: python manage.py runserver.
#### 8. Access the Django admin page at http://localhost:8000/admin/.

#### Frontend Setup
#### 1. Open Terminal and change the directory to the frontend folder: cd path/to/frontend.
#### 2. Start the frontend project: npm start.
#### 3. The web app should now be accessible on a local host in the web browser.





