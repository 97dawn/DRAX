import React from 'react';
import 'bootstrap/dist/css/bootstrap.min.css'; // global css
import '../gui/css/common.css'; // global css
import {BrowserRouter, Route, Switch, Redirect} from "react-router-dom";
import Login from "./Login";
import Main from "./Main";
import Signup from "./Signup";
import {ProtectedRoute} from "../common/ProtectedRoute";
import {IfAuthenticatedRoute} from "../common/IfAuthenticatedRoute";
import {Not_Found} from "./Not_Found";
import Authenticator from "../common/Authenticator";

class Root extends React.Component{
    constructor(props) {
        super(props);
        this.state = {
            valid_initial_session: null
        }
    }

    componentDidMount() {
        // sets if the there was existing initial session only.
        Authenticator.checkAlive().then(()=>{
            this.setState({valid_initial_session: Authenticator.isAuthenticated()});
        });
    }


    render() {
        return(
                <BrowserRouter>
                    {/*redirects to /main/search if landed on / */}
                    <Switch>
                        <Route exact path='/'  component={(props) =>{
                            console.log("redirected");
                            return(<Redirect {...props} to={
                                {
                                    pathname: "/main/search",
                                    state: {
                                        from: props.location
                                    }
                                }
                            }/>);
                        }}
                        />
                        <Route exact path='/main'  component={(props) =>{
                            console.log("redirected");
                            return(<Redirect {...props} to={
                                {
                                    pathname: "/main/search",
                                    state: {
                                        from: props.location
                                    }
                                }
                            }/>);
                        }}
                        />
                        {/* /login and /signed up will redirect to main if already loggined*/}
                        <IfAuthenticatedRoute session={this.state.valid_initial_session} path="/login" component={Login}/>
                        <IfAuthenticatedRoute session={this.state.valid_initial_session} path="/signup" component={Signup}/>
                        {/*/main will redirect to login if not authenticated else serve the main content*/}
                        <ProtectedRoute session={this.state.valid_initial_session} path="/main" component={Main}/>
                        <Route component={Not_Found}/>
                    </Switch>
                </BrowserRouter>
        )
    }
}

export default Root;