# SEG_time_management
# Team Members
The members of the team are:
- Sakar Rai
<<<<<<< HEAD
- Karim He
=======
- Extreme Limbu
>>>>>>> 63d2473 (Readme added name)

# Reference list

# Deployment location

# Installation instructions

Install all required packages:

```
$ pip3 install -r requirements.txt
```

Migrate the database:

```
$ python3 manage.py migrate
```

Seed the development database with:

```
$ python3 manage.py seed
```

Run all tests with:
```
$ python3 manage.py test
```


**Ruff Formatter / linter**
<br>
Run these commands in terminal (install requirements.txt first) before creating a pull request to check and fix linting issues.
<br>
Configured Ruff so that it upholds Band V Code quality marking criteria. 
<br>
Automated tests on GitHub when PR is created - Run's Ruff tests for Band V marking & Run's all Django tests.
<br>
```
ruff check
ruff format . --check
```

