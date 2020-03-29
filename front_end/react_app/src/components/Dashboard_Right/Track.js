import React from "react";
import '../../gui/css/track_application.css';
import Application from "./Application";
import {SERVER_URL, STATUS_OK} from "../../common/Constants";
import ScatterPlotModal from "./ScatterPlotModal";
import SearchCollege from "./SearchCollege";




const APPLICATION_ENDPOINT = "/track_applications_list";
const HIGHSCHOOL_ENDPOINT = "/get_all_highschools";

class Track extends React.Component{



    constructor(props) {
        super(props);
        this.state = {
            show_filtered: false,
            summary: {
                avg_gpa: "",
                avg_sat_ebrw: "",
                avg_sat_math: "",
                avg_act_composite: ""
            },
            filter_data: {
                college_class: {from: "" , to: ""},
                checked_high_schools: [],
                application_status: [],
                name: "",
                policy: "strict"
            },
            high_schools: [],
            applications: [],
            current_page_num: 1,
            show_modal: false,
            not_found : false
        }
        this.button_list = [];
        this.searchClicked = this.searchClicked.bind(this);
        this.fetch_highschool = this.fetch_highschool.bind(this);
        this.get_high_school = this.get_high_school.bind(this);
        this.high_school_checked = this.high_school_checked.bind(this);
        this.application_checked = this.application_checked.bind(this);
        this.fetch_applications = this.fetch_applications.bind(this);
        this.get_applications = this.get_applications.bind(this);
        this.get_input_json = this.get_input_json.bind(this);
        this.input_check = this.input_check.bind(this);
    }


    async fetch_highschool() {
        try{
            let response = await fetch(
                SERVER_URL + HIGHSCHOOL_ENDPOINT
            );

            if(response.status !== STATUS_OK) throw new Error(response.statusText);
            let response_json = await response.json();
            this.setState({high_schools: response_json.highschools});
        }catch (err) {
            console.log(err.stack);
            alert(err.message);
        }

    }

    get_input_json (){
        let body = {
            college_name: (this.state.filter_data.name === "") ? null : this.state.filter_data.name,
            college_class_min: (this.state.filter_data.college_class.from === "") ? null : parseInt(this.state.filter_data.college_class.from),
            college_class_max: (this.state.filter_data.college_class.to === "") ? null : parseInt(this.state.filter_data.college_class.to),
            statuses: (this.state.filter_data.application_status.length === 0) ? null : this.state.filter_data.application_status,
            high_schools: (this.state.filter_data.checked_high_schools.length === 0) ? null : this.state.filter_data.checked_high_schools
        }
        return body;
    }

    async fetch_applications(){
        try{
            this.input_check();
            // deep copy
            let body = this.get_input_json();
            console.log(body);
            let response = await fetch(
                SERVER_URL + APPLICATION_ENDPOINT,
                {
                    method: 'POST',
                    credentials: 'include',
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(body)
                }
            );

            if(response.status !== STATUS_OK) throw new Error(response.statusText);
            let response_json = await response.json();
            if(response_json.status !== STATUS_OK) {
                let summary = {
                avg_gpa: "",
                avg_sat_ebrw: "",
                avg_sat_math: "",
                avg_act_composite: ""
                }
                this.state.applications = [];
                this.setState({summary: summary, not_found: true});
                return;
            }
            console.log(response_json);
            let summary = {
                avg_gpa: (response_json.summary.avg_gpa == null) ? "-" : response_json.summary.avg_gpa,
                avg_sat_ebrw: (response_json.summary.avg_sat_ebrw == null) ? "-" : response_json.summary.avg_sat_ebrw,
                avg_sat_math: (response_json.summary.avg_sat_math == null) ? "-" : response_json.summary.avg_sat_math,
                avg_act_composite: (response_json.summary.avg_act == null) ? "-" : response_json.summary.avg_act
            }
            this.state.not_found = (response_json.profiles.length === 0) ? true : false;
            this.setState({applications: response_json.profiles, summary: summary});
        }catch (err) {
            console.log(err.stack);
            alert(`failed to fetch new application list, err msg: ${err.message}`);
        }
    }

    input_check(){
        let filter_data = this.state.filter_data;
        if(filter_data.college_class.from > 2027 || filter_data.college_class.to > 2027) throw new Error("collage class should be < 2027");
        if(filter_data.name === "") throw new Error("college name can not be empty");
    }

    get_applications(){
        if(this.state.not_found){
            return (<h1 style={SearchCollege.not_found_style}>No profiles found</h1>);
        }
        let applications = [];
        let beginning = (this.state.current_page_num === 1) ? 0 : (this.state.current_page_num - 1) * 10;
        let end_index = beginning + 10;
        let displayItems = this.state.applications.slice(beginning, end_index);
        displayItems.forEach((element, index)=>{
            let {application_status, username, residence_state, high_school_name, high_school_city, high_school_state, gpa, college_class } = element;
            let {major_1, major_2, sat_math, sat_ebrw, act_english, act_math, act_reading, act_science, act_composite, sat_lit, sat_us, sat_world, sat_math_1, sat_math_2, sat_eco_bio, sat_mol_bio, sat_chem, sat_physics, ap_passed} = element;
            applications.push(
                <Application
                    key={index}
                    btn_info={{
                        username: (username == null) ? "-" : username,
                        acceptance: (application_status == null) ? "-" : application_status,
                        high_school: (high_school_name == null) ? "-" : high_school_name,
                        high_school_location: (high_school_state == null || high_school_city == null) ? "-" : `${high_school_city}, ${high_school_state}`
                    }}
                    personal={{
                        state: (residence_state == null) ? "-" : residence_state,
                        math: (sat_math == null) ? "-" : sat_math,
                        ap: (ap_passed == null) ? "-" : ap_passed,
                        majors1: (major_1 == null) ? "-" : major_1,
                        class: (college_class == null) ? "-"  : college_class,
                        ebrw: (sat_ebrw == null) ? "-" : sat_ebrw,
                        gpa: (gpa == null) ? "-" : gpa,
                        majors2: (major_2 == null) ? "-" : major_2
                    }}
                    sat2={{
                        chemistry: (sat_chem == null) ? "-" : sat_chem,
                        eco_bio: (sat_eco_bio == null) ? "-" : sat_eco_bio,
                        literature: (sat_lit == null) ? "-" : sat_lit,
                        mol_bio: (sat_mol_bio == null) ? "-" : sat_mol_bio,
                        math_I: (sat_math_1 == null) ? "-" : sat_math_1,
                        math_II: (sat_math_2 == null) ? "-" : sat_math_2,
                        physics: (sat_physics == null) ? "-" : sat_physics,
                        us_history: (sat_us == null) ? "-" : sat_us,
                        world_history: (sat_world == null) ? "-" : sat_world
                    }}
                    act={{
                        english: (act_english == null) ? "-" : act_english,
                        math: (act_math == null) ? "-" : act_math,
                        reading: (act_reading == null) ? "-" : act_reading,
                        science: (act_science == null) ? "-" : act_science,
                        composite: (act_composite == null) ? "-" : act_composite
                    }}
                />
            );
        });
        return applications;
    }



    high_school_checked(event){
        let current_high_schools = this.state.filter_data.checked_high_schools;
        let school = event.target.id;
        if(current_high_schools.includes(school)){
            let index = current_high_schools.indexOf(school);
            current_high_schools.splice(index, 1);
        }else{
            current_high_schools.push(school);
        }
        this.setState({filter_data:{...this.state.filter_data, checked_high_schools: current_high_schools}})
    }

    get_high_school(){
            let result = []
            for(let i = 0; i < this.state.high_schools.length; i+=3){
                result.push(this.state.high_schools.slice(i, i+3));
            }

            result = result.map((tr_array, index) => {
                return(
                    <tr key={`tr-key-${index}`}>
                        {
                            tr_array.map((element)=>{
                                return(
                                    <td key={element}>
                                        <div className="custom-control custom-checkbox">
                                            {/* IMPORTANT! "input" tag's "id" property value and "label" tag's "for" property value should be matched */}
                                            <input type="checkbox"
                                                   className="custom-control-input"
                                                   id={element}
                                                   checked={this.state.filter_data.checked_high_schools.includes(element)}
                                                   onChange={this.high_school_checked}
                                            />
                                                   <label className="custom-control-label"
                                                          htmlFor={element}>{element}
                                                   </label>
                                        </div>
                                    </td>
                                    )
                                }
                            )
                        }
                    </tr>
                );
            });
        return result;
    }

    is_whole_number(n) {
        let result = (n - Math.floor(n)) !== 0;

        if (result)
            return false;
        else
            return true;
    }


    get_page_buttons(){
        let page_list = [];
        let new_button_list = [];
        let max_pages = this.state.applications.length / 10;
        if(!this.is_whole_number(max_pages)) {
            max_pages = Math.floor(max_pages) + 1;
        }
        let next_ten_pages = this.state.current_page_num + 9;
        let old_beginning = this.button_list[0];
        let old_end = this.button_list[this.button_list.length - 1];
        if(this.state.applications.length <= 10) {
            max_pages = 1;
        }

        if(this.state.current_page_num === 1){
            for(let i = 1 ; i <= max_pages && i <= next_ten_pages; i++){
                new_button_list.push(i);
                page_list.push(
                    <li  key={`key-${i}`} className="page-item">
                        <button onClick={this.page_clicked} className={`page-link shadow-none ${(i === this.state.current_page_num) ? "active" : ""}`}>{i}</button>
                    </li>
                )
            }
        }else if(this.state.current_page_num === old_end && !(this.button_list.length < 10) && (this.state.current_page_num !== max_pages)){
            for(let i = old_end; i <= max_pages && i <= next_ten_pages; i++){
                new_button_list.push(i);
                page_list.push(
                    <li  key={`key-${i}`} className="page-item">
                        <button onClick={this.page_clicked} className={`page-link shadow-none ${(i === this.state.current_page_num) ? "active" : ""}`}>{i}</button>
                    </li>
                )
            }
        }else if(this.state.current_page_num === old_beginning){
            let previous_ten = this.state.current_page_num - 9;
            if(previous_ten < 1) previous_ten = 1;
            for(let i = previous_ten ; i <= max_pages && i <= old_beginning; i++){
                new_button_list.push(i);
                page_list.push(
                    <li  key={`key-${i}`} className="page-item">
                        <button onClick={this.page_clicked} className={`page-link shadow-none ${(i === this.state.current_page_num) ? "active" : ""}`}>{i}</button>
                    </li>
                )
            }
        }else if((this.button_list.includes(this.state.current_page_num)) || (this.button_list.length < 10)){
            for(let i = old_beginning ; i <= old_end; i++){
                new_button_list.push(i);
                page_list.push(
                    <li  key={`key-${i}`} className="page-item">
                        <button onClick={this.page_clicked} className={`page-link shadow-none ${(i === this.state.current_page_num) ? "active" : ""}`}>{i}</button>
                    </li>
                )
            }
        }
        if(this.state.applications.length === 0){
            this.button_list = [];
            return [];
        }
        this.button_list = new_button_list;
        return page_list;
    }

    application_checked(event){
        let current_application = this.state.filter_data.application_status;
        let status = event.target.id;
        if(current_application.includes(status)){
            let index = current_application.indexOf(status);
            current_application.splice(index, 1);
        }else{
            current_application.push(status);
        }
        this.setState({filter_data:{...this.state.filter_data, application_status: current_application}})
    }


    componentDidMount() {
        if (typeof this.props.location.state !== 'undefined') {
            let college_name = this.props.location.state.college_name;
            this.state.filter_data.name = college_name;
            this.fetch_applications();
            this.props.update_active_tab("track");
        }
        this.fetch_highschool();

    }



    searchClicked(event){
        this.fetch_applications();

    }

    render() {
        let high_schools = this.get_high_school();
        let page_buttons = this.get_page_buttons();
        let applications = this.get_applications();
        return (
            <div className="right-content">
                    <div className="wrap-search-result">
                        <div className="wrap-search-filters">
                            <div className="search-box">
                                <div className="input-group mb-3">
                                    <input type="text" className="form-control shadow-none" placeholder="College name"
                                           aria-label="College name" aria-describedby="search-btn"
                                           value={this.state.filter_data.name}
                                           onChange={(event)=>{
                                                this.setState({filter_data:{...this.state.filter_data, name: event.target.value}});
                                           }}
                                    />
                                    <div className="input-group-append">
                                        <button onClick={this.searchClicked}
                                            className="btn btn-outline-secondary shadow-none" type="button"
                                            id="search-btn">
                                            Search
                                        </button>
                                    </div>
                                </div>
                            </div>
                            <div className="filters-box">
                                <div className="filters-dropdown">
                                    <button onClick={()=>{
                                        this.setState({show_filter: !this.state.show_filter});
                                    }}
                                        className="btn btn-secondary shadow-none" type="button"
                                        id="filters-dropdown-btn"
                                    >
                                        Filters
                                    </button>
                                    <div style={{display: (this.state.show_filter) ? "flex" : "None"}} id="filters-dropdown-content" >
                                        <table>
                                            <tbody>
                                            <tr>
                                                <td id="wrap-college-class"><b>College class</b>
                                                    <div className="wrap-filter">
                                                        <input type="number" className="form-control shadow-none"
                                                               id="college-class-min" placeholder="< 2027" max={2027}
                                                               value={this.state.filter_data.college_class.from}
                                                               onChange={(event)=> {
                                                                   this.setState({filter_data: {...this.state.filter_data,
                                                                           college_class: {...this.state.filter_data.college_class,
                                                                               from:event.target.value}}});
                                                               }}
                                                        />
                                                        - <input type="number" className="form-control shadow-none"
                                                                 id="college-class-max" placeholder="< 2027"
                                                                 max={2027}
                                                                 value={this.state.filter_data.college_class.to}
                                                                 onChange={(event)=> {
                                                                   this.setState({filter_data: {...this.state.filter_data,
                                                                           college_class: {...this.state.filter_data.college_class,
                                                                               to:event.target.value}}});
                                                               }}
                                                    />
                                                    </div>
                                                </td>

                                                <td id="wrap-application-status"><b>Application status</b>
                                                    <div className="wrap-filter">
                                                        <table>
                                                            <tbody>
                                                            <tr>
                                                                <td>
                                                                    <div className="custom-control custom-checkbox">
                                                                        <input type="checkbox"
                                                                               className="custom-control-input"
                                                                               id="accepted"
                                                                               checked={this.state.filter_data.application_status.includes("accepted")}
                                                                               onChange={this.application_checked}
                                                                        />
                                                                        <label className="custom-control-label"
                                                                               htmlFor="accepted">Accepted</label>
                                                                    </div>
                                                                </td>
                                                                <td>
                                                                    <div className="custom-control custom-checkbox">
                                                                        <input type="checkbox"
                                                                               className="custom-control-input"
                                                                               id="denied"
                                                                               checked={this.state.filter_data.application_status.includes("denied")}
                                                                               onChange={this.application_checked}
                                                                        />
                                                                        <label className="custom-control-label"
                                                                               htmlFor="denied">Denied</label>
                                                                    </div>
                                                                </td>
                                                                <td>
                                                                    <div className="custom-control custom-checkbox">
                                                                        <input type="checkbox"
                                                                               className="custom-control-input"
                                                                               id="deferred"
                                                                               checked={this.state.filter_data.application_status.includes("deferred")}
                                                                               onChange={this.application_checked}
                                                                        />
                                                                        <label className="custom-control-label"
                                                                               htmlFor="deferred">Deferred</label>
                                                                    </div>
                                                                </td>
                                                            </tr>

                                                            <tr>
                                                                <td>
                                                                    <div className="custom-control custom-checkbox">
                                                                        <input type="checkbox"
                                                                               className="custom-control-input"
                                                                               id="wait-listed"
                                                                               checked={this.state.filter_data.application_status.includes("wait-listed")}
                                                                               onChange={this.application_checked}
                                                                        />
                                                                        <label className="custom-control-label"
                                                                               htmlFor="wait-listed">Wait-listed</label>
                                                                    </div>
                                                                </td>
                                                                <td>
                                                                    <div className="custom-control custom-checkbox">
                                                                        <input type="checkbox"
                                                                               className="custom-control-input"
                                                                               id="withdrawn"
                                                                               checked={this.state.filter_data.application_status.includes("withdrawn")}
                                                                               onChange={this.application_checked}
                                                                        />
                                                                        <label className="custom-control-label"
                                                                               htmlFor="withdrawn">Withdrawn</label>
                                                                    </div>
                                                                </td>
                                                                <td>
                                                                    <div className="custom-control custom-checkbox">
                                                                        <input type="checkbox"
                                                                               className="custom-control-input"
                                                                               id="pending"
                                                                               checked={this.state.filter_data.application_status.includes("pending")}
                                                                               onChange={this.application_checked}
                                                                        />
                                                                        <label className="custom-control-label"
                                                                               htmlFor="pending">Pending</label>
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                </td>
                                            </tr>
                                            <tr style={{height: '15px'}}/>
                                            <tr>
                                                <td id="wrap-high-school"><b>High school</b>
                                                    <div className="wrap-filter">
                                                        <table>
                                                            <tbody>
                                                                {high_schools}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                </td>
                                            </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                                <div className="filters-radio">
                                    <div className="custom-control custom-radio">
                                        <input type="radio" id="strict" name="customRadio"
                                               className="custom-control-input"
                                               checked={this.state.filter_data.policy === "strict"}
                                               onChange={(event)=>{
                                                    this.setState({filter_data: {...this.state.filter_data, policy: "strict"}});
                                                    console.log(this.state.filter_data.policy);
                                               }}
                                        />
                                        <label className="custom-control-label" htmlFor="strict">Strict</label>
                                    </div>
                                    <div className="custom-control custom-radio">
                                        <input type="radio" id="lax" name="customRadio"
                                               className="custom-control-input"
                                               checked={this.state.filter_data.policy === "lax"}
                                               onChange={(event)=>{
                                                   this.setState({filter_data: {...this.state.filter_data, policy: "lax"}});
                                                   console.log(this.state.filter_data.policy);
                                               }}
                                        />
                                        <label className="custom-control-label" htmlFor="lax">Lax</label>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="wrap-result">
                            <div className="result-top">
                                <span style={{display: ((this.state.summary.avg_gpa === '') && (!this.state.not_found)) ? "None" : ""}} className="result-text">Results</span>
                                <button type="button" id="plot-btn" className="btn btn-primary shadow-none"
                                        data-toggle="modal" data-target="#plot-modal"
                                        style={{display: (this.state.summary.avg_gpa === '') ? "None" : "", marginBottom: "5%"}}
                                        onClick={(event) => this.setState({show_modal: !this.state.show_modal})}
                                >
                                    View scatterplot
                                </button>
                                <ScatterPlotModal input_json={this.get_input_json()} show={this.state.show_modal} on_hide={(event) => this.setState({show_modal: !this.state.show_modal})}/>
                            </div>
                            {/* Initially, there should be no tags inside the "#summary" tag below. */}
                            <div style={{display: (this.state.summary.avg_gpa === "") ? "None" : ""}} className="list-group" id="summary">
                                <h4><b>Summary</b></h4>
                                {/* The table tag below must be shown whenever the user gets the result in the track application menu */}
                                <table>
                                    <tbody>
                                    <tr>
                                        {/* Frontend ajax should put data inside the b tags below */}
                                        {/* If there's no application list, then put dash inside the b tags */}
                                        <td><b>{this.state.summary.avg_gpa}</b><br/><label>Average GPA</label></td>
                                        <td><b>{this.state.summary.avg_sat_ebrw}</b><br/><label>Average SAT EBRW</label></td>
                                        <td><b>{this.state.summary.avg_sat_math}</b><br/><label>Average SAT Math</label></td>
                                        <td><b>{this.state.summary.avg_act_composite}</b><br/><label>Average ACT Composite</label></td>
                                        <td/>
                                    </tr>
                                    </tbody>
                                </table>
                            </div>
                            {/* Initially, there should be no tags inside the "#application-list" tag below. */}
                            {/* "button" tag with class="list-group-item list-group-item-action" and "div" tag with class="carousel slide" are a pair */}
                            {/* Frontend ajax should add these pairs with data inside the tag below */}
                            <div className="list-group" id="application-list">
                                {applications}
                            </div>
                            <nav>
                                {/* Initially, there should be no tags inside the tag below. */}
                                <ul className="pagination" id="pagination">
                                    {page_buttons}
                                </ul>
                            </nav>
                        </div>
                    </div>
                </div>
        )
    }
}

export default Track;