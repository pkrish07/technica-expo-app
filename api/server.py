# Main server file
from flask import Flask, jsonify, request
from flask_pymongo import PyMongo
from pymongo import MongoClient
from bson.objectid import ObjectId
from bson import json_util
import json
import hashlib

app = Flask(__name__)
app.config.from_object('config')
mongo = PyMongo(app)


@app.route('/')
def hello():
    return get_all_projects()


# Public routes ################################################################
# All endpoints under the public routes should not require any authentication.

@app.route('/api/projects', methods=['GET'])
def get_all_projects():
    projects = mongo.db.projects

    output = []
    for p in projects.find():
        temp_project = {
            'table_number': p['table_number'],
            'project_name': p['project_name'],
            'project_url': p['project_url'],
            'attempted_challenges': p['attempted_challenges'],
            'challenges_won': p['challenges_won']
        }
        output.append(temp_project)

    return jsonify({'All Projects': output})

@app.route('/api/projects/id/<project_id>', methods=['GET'])
def get_project(project_id):
    projects = mongo.db.projects

    project_obj = projects.find_one({'_id': ObjectId(project_id)})
    return json.dumps(project_obj, default=json_util.default)


# Admin routes #################################################################
# All endpoints under the Admin routes should require admin authorization.

## MONGODB SCHEMA:
# Project (data from Devpost)
    # Table Number
    # Project Name
    # Project URL
    # Attempted Challenges
    # Challenges Won

@app.route('/api/projects/add', methods=['POST'])
def add_project():
    projects = mongo.db.projects

    table_number = request.json['table_number']
    project_name = request.json['project_name']
    project_url = request.json['project_url']
    attempted_challenges = request.json['attempted_challenges']
    challenges_won = request.json['challenges_won']

    project = {
        'table_number': table_number,
        'project_name': project_name,
        'project_url': project_url,
        'attempted_challenges': attempted_challenges,
        'challenges_won': challenges_won
    }

    project_id = projects.insert(project)
    return project_id

@app.route('/api/projects/bulk_add', methods=['POST'])
def bulk_add_project():
    projects = mongo.db.projects

    packet = request.json['projects']

    result = projects.insert_many(packet)
    return jsonify({'New IDs': "tmp"})

@app.route('/api/projects/delete', methods=['DELETE'])
def delete_project():
    projects = mongo.db.projects

    project_id = request.json['project_id']
    projects.delete_one({'_id': project_id})


@app.route('/api/projects/deleteAll', methods=['DELETE'])
def delete_all_projects():
    projects = mongo.db.projects

    projects.delete_many({})
    return jsonify({'Delete': 'all'})


# Company (defined by organizers in admin dash)
    # Company Name
    # Access code
    # Challenge Name
    # Number of prizes they can choose per challenge
    # ProjectID that won the challenge

@app.route('/api/companies/add', methods=['POST'])
def add_company():
    companies = mongo.db.companies

    company_name = request.json['company_name']
    access_code = request.json['access_code']

    # Currently only 1 challenge per company - create another company with same
    # access_code and company_name if need another prize

    # TODO(kjeffc) Make prize selection compatible with this system
    # (e.g. Company X is in the DB twice, but with same access token - they
    # shouldn't notice a difference/have to re-login etc...)
    challenge_name = request.json['challenge_name']
    num_winners = request.json['num_winners']

    company = {
        'company_name': company_name,
        'access_code': access_code,
        'challenge_name': challenge_name,
        'num_winners': num_winners,
        'winners': []      # Empty array
    }

    company_id = str(companies.insert(company))
    return company_id

@app.route('/api/companies/id/<company_id>', methods=['GET'])
def get_company(company_id):
    companies = mongo.db.companies

    company_obj = companies.find_one({'_id': ObjectId(company_id)})
    return json.dumps(company_obj, default=json_util.default)

@app.route('/api/companies', methods=['GET'])
def get_all_companies():
    companies = mongo.db.companies

    output = []
    for c in companies.find():
        temp_company = {
            'company_name': c['company_name'],
            'access_code': c['access_code'],
            'challenge_name': c['challenge_name'],
            'num_winners': c['num_winners'],
            'winners': c['winners']
        }
        output.append(temp_company)

    return jsonify({'All Companies' : output})


# Private / sponsor routes #####################################################
# All endpoints under the private routes should require the access token.




if __name__ == '__main__':
    app.run(debug=True)
