import csv
import hash_utils
from classes import Account, Application, StudentProfile, College

from mongoengine import *
connect('account', host='localhost', port=27017)

def import_student_data(filename):
    lines = []
    with open(filename) as f:
        reader = csv.reader(f)
        for line in reader:
            lines.append(line)

    header = lines[0]

    index = ['username', 'password', 'state', 'high_school_name', 'high_school_city',
             'high_school_state', 'gpa', 'college_class', 'major_1',
             'major_2', 'sat_math', 'sat_ebrw', 'act_english', 'act_math',
             'act_reading', 'act_science', 'act_composite', 'sat_lit',
             'sat_us', 'sat_world', 'sat_math_1', 'sat_math_2', 'sat_eco_bio',
             'sat_mol_bio', 'sat_chem', 'sat_physics', 'ap_passed']
    
    for line in lines[1:]:
        username = line[0]
        password = line[1]
        salt = hash_utils.generate_salt()
        digest = hash_utils.hmac_hash(password, salt)
        account = Account(username=username,
                          hashed_password=digest,
                          salt=salt, type="Student")
        
        try:
            account.save()
        except Exception as e:
            # print(e)
            print("There was an error importing student data: "+username)

    for line in lines[1:]:
        username = line[0]
        try:
            account = Account.objects.get(username=username, type="Student")
        except:
            print("Account could not be loaded: "+username)
            continue
        # Make student profile class
        # TODO: Decide on what attributes are optional
        # TODO: Add checks for if this data is not pressent?
        
        p = StudentProfile(
            student = account,
            gpa = float(line[index.index('gpa')]),
            residence_state=line[index.index('state')],
            high_school_name=line[index.index('high_school_name')],
            high_school_city=line[index.index('high_school_city')],
            high_school_state=line[index.index('high_school_state')],
            college_class=line[index.index('college_class')])
        for x in range(index.index('major_1'), len(index)):
            info = index[x]
            data = line[x]
            if data!='': # the field isn't empty
                p.grades[info] = data

        try:
            p.save()
        except Exception as e:
            print(e)
            print("Profile couldn't be loaded: "+username)
            continue
        
        
def import_application_data(filename):
    lines = []
    with open(filename) as f:
        reader = csv.reader(f)
        for line in reader:
            lines.append(line)
    for line in lines[1:]:
        username = line[0]
        college = line[1].strip()
        status = line[2].capitalize()
        # find the student by username
        # find the college by name

        try:
            account = Account.objects.get(username=username, type="Student")
            student = StudentProfile.objects.get(student=account)
        except DoesNotExist as e:
            print("Student Doesn't Exist: "+username)
            continue
        try:
            university = College.objects.get(name=college)
        except:#  DoesNotExist as e:
            print("College Doesn't Exist: "+college)
            continue

        ID = hash_utils.sha_hash(username+"+=+"+college)
        app = Application(ID=ID, student=student,
                          college=university,
                          status=status)
        try:
            app.save()
        except Exception as e:
            print("There was a problem with this application")
            print(e)
            print(line[0]+" "+line[1])
            continue
    
def delete_student_data():
    Account.objects(type="Student").delete() # should delete all account fields, including admin?
    # StudentProfile.objects().delete()
    # Application.objects().delete() 

def institution_type(arg):
    switcher = {
        "1": "Public",
        "2": "Private Nonprofit",
        "3": "Private For-Profit",
    }
    return switcher.get(arg, None)

def get_region(region, state):
    northeast = ["NJ", "NY", "PA"]
    south = ["DE", "DC", "MD", "OK", "TX"]
    west = ["AZ", "NM"]
    if region == "1" or state in northeast:
        return "Northeast"
    if region == "3" or region == "4":
        return "Midwest"
    if region == "5" or state in south:
        return "South"
    if region == "7" or region == "8" or state in west:
        return "West"
    if region == "9":
        return "Other"

def get_size(size):
    if size <= 500:
        return "Small"
    elif size <= 10000:
        return "Medium"
    else:
        return "Large"

def import_college_scorecard(scorecard, colleges):
    f = open(colleges, "r")
    college_list = []
    mod_list = []
    for c in f:
        n = c.rstrip()
        college_list.append(n)
        mod_list.append(n.replace("&", "and").replace(",", "").replace("The ", ""))
    f.close()
    with open(scorecard) as sc:
        sc_reader = csv.reader(sc)
        header = next(sc_reader)
        for line in sc_reader:
            sc_name = line[header.index("INSTNM")]
            sc_mod_name = sc_name.replace("-", " ").replace("The ", "").replace("Saint", "St")
            name = ""
            if sc_name in college_list:
                name = sc_name
            elif sc_mod_name in mod_list:
                name = college_list[mod_list.index(sc_mod_name)]
            if name != "":
                city = line[header.index("CITY")]
                state = line[header.index("STABBR")]
                region = get_region(line[header.index("REGION")], state)
                institution = institution_type(line[header.index("CONTROL")])
                admission_rate = line[header.index("ADM_RATE")]
                size = get_size(int(line[header.index("UGDS")]))
                median_debt = line[header.index("GRAD_DEBT_MDN")]
                salary = line[header.index("MN_EARN_WNE_P6")]
                if admission_rate != "NULL":
                    college = College(
                        name=name, city=city, state=state, region=region, institution=institution,
                        admission_rate=admission_rate, size=size, median_debt=median_debt, salary = salary,
                    )
                else:
                    college = College(
                        name=name, city=city, state=state, region=region, institution=institution,
                        size=size, median_debt=median_debt, salary = salary,
                    )
                try:
                    college.save()
                except:
                    print("Error importing college: " + name)

# global variable to store the file content of colleges.txt in list form
college_list = None
# function to read the file list should only happen once?
def generate_collegetxt_list():
    global college_list
    with open('colleges.txt') as f:
        data = f.read().split('\n')
        cleaned_data = []
        for college in data: # clean the names
            name = college # moved cleaning elsewhere
            cleaned_data.append(name)
    college_list = cleaned_data
    return cleaned_data

def get_collegetxt_list(refresh=False):
    global college_list
    if (college_list == None or refresh == False):
        return generate_collegetxt_list() # wait, will our global variable be refreshed?
    return college_list

'''
college = College(name='Massachusetts Institute of Technology')
college.save()
college = College(name='Stony Brook University')
college.save()

college = College(name='Princeton')
college.save()
college = College(name='Cornell University')
college.save()'''
# delete_student_data()
# import_student_data("students-1.csv") 
# import_application_data('applications-1.csv')