import { authentication } from 'wix-members-frontend';

$w.onReady(function () {
    if( authentication.loggedIn() ) {
        $w("#btnLoginG").label = "Dashboard";
    }
    else {
        $w("#btnLoginG").label = "Log in";
    }
});
