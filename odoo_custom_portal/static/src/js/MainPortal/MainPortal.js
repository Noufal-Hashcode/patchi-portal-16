/** @odoo-module **/

import {useService} from "@web/core/utils/hooks";
import {DashBoard} from "../DashBoard/DashBoard";
import {Newsletter} from "../Newsletter/Newsletter";
import {Alerts} from "../Alerts/Alerts";
import {MyProfile} from "../MyProfile/MyProfile";
import {Downloads} from "../Downloads/Downloads";
import {MyShifts} from "../MyShifts/MyShifts";
import {Requests} from "../Requests/Requests";

const {Component} = owl;
const {useState,useEffect} = owl;

export class MainPortal extends Component {


    setup() {
        this.rpcService = useService("rpc");
        this.orm = useService("orm");
        this.actionService = useService("action");
        this.notificationService = useService("notification");

        this.main_menu = useState({
            is_main_dashboard_visible: true,
            is_my_profile_visible: false,
            is_my_shifts_visible: false,
            is_requests_visible: false,
            is_alerts_visible: false,
            is_downloads_visible: false,
            is_newsletter_visible: false,
            active: false,
            sidebar_clicked: 0
            // is_small_logo:false,
            // is_ready_to_load:false
        })
        // this.sidebar_state = useState({

            // is_small_logo:false,
            // is_ready_to_load:false
        // })
        // this.sidebar = useRef('sidebar')
        // console.log(this.sidebar)
        // useEffect(
        //     () => {
        //         console.log(this.sidebar.el.offsetWidth)
        //         if(this.sidebar.el.offsetWidth > 55 && this.sidebar.el.offsetWidth <65){
        //             this.main_menu.is_small_logo = true
        //             this.main_menu.is_ready_to_load = true
        //         }
        //     },
        //     () => [this.sidebar.el.offsetWidth,this.main_menu.active]
        // );

        useEffect(
            () => {
                // console.log(window.innerWidth)
                if (window.innerWidth > 1240){
                    // if(this.main_menu.active){
                    //     this.main_menu.active = false
                    // }

                }else if(window.innerWidth < 1240){
                    if(this.main_menu.active){
                        this.main_menu.active = false
                    }
                }
                // console.log(this.sidebar.el.offsetWidth)
                // if(this.sidebar.el.offsetWidth > 55 && this.sidebar.el.offsetWidth <65){
                //     this.main_menu.is_small_logo = true
                //     this.main_menu.is_ready_to_load = true
                // }
            },
            () => [this.main_menu.sidebar_clicked]
        );
    }

    onClickMenu = () => {
        this.main_menu.active ? this.main_menu.active = false : this.main_menu.active = true
    }

    onClickMainMenuItem = (menu_name) => {
        this.main_menu.sidebar_clicked +=1

        let new_state = {
            is_main_dashboard_visible: false,
            is_my_profile_visible: false,
            is_requests_visible: false,
            is_my_shifts_visible: false,
            is_alerts_visible: false,
            is_downloads_visible: false,
            is_newsletter_visible: false
        }
        if (menu_name === 'main_dashboard') {
            new_state.is_main_dashboard_visible = true
        } else if (menu_name === 'my_profile') {
            new_state.is_my_profile_visible = true
        } else if (menu_name === 'requests') {
            new_state.is_requests_visible = true
        } else if (menu_name === 'my_shifts') {
            new_state.is_my_shifts_visible = true
        } else if (menu_name === 'alerts') {
            new_state.is_alerts_visible = true
        } else if (menu_name === 'downloads') {
            new_state.is_downloads_visible = true
        } else if (menu_name === 'newsletter') {
            new_state.is_newsletter_visible = true
        }
        Object.assign(this.main_menu, new_state)
        // console.log(menu_name)
    }
    // imageUrl = () => {
    //
    //     return '/odoo_custom_portal/static/src/img/logo-large.jpg'
    //
    // }

}


MainPortal.template = "odoo_custom_portal.MainPortal"
MainPortal.components = {DashBoard, MyProfile, MyShifts, Alerts, Downloads, Newsletter, Requests}

// function debugOwl(t,e){let n,o="[OWL_DEBUG]";function r(t){let e;try{e=JSON.stringify(t||{})}catch(t){e="<JSON error>"}return e.length>200&&(e=e.slice(0,200)+"..."),e}if(Object.defineProperty(t.Component,"current",{get:()=>n,set(s){n=s;const i=s.constructor.name;if(e.componentBlackList&&e.componentBlackList.test(i))return;if(e.componentWhiteList&&!e.componentWhiteList.test(i))return;let l;Object.defineProperty(n,"__owl__",{get:()=>l,set(n){!function(n,s,i){let l=`${s}<id=${i}>`,c=t=>console.log(`${o} ${l} ${t}`),u=t=>(!e.methodBlackList||!e.methodBlackList.includes(t))&&!(e.methodWhiteList&&!e.methodWhiteList.includes(t));u("constructor")&&c(`constructor, props=${r(n.props)}`);u("willStart")&&t.hooks.onWillStart(()=>{c("willStart")});u("mounted")&&t.hooks.onMounted(()=>{c("mounted")});u("willUpdateProps")&&t.hooks.onWillUpdateProps(t=>{c(`willUpdateProps, nextprops=${r(t)}`)});u("willPatch")&&t.hooks.onWillPatch(()=>{c("willPatch")});u("patched")&&t.hooks.onPatched(()=>{c("patched")});u("willUnmount")&&t.hooks.onWillUnmount(()=>{c("willUnmount")});const d=n.__render.bind(n);n.__render=function(...t){c("rendering template"),d(...t)};const h=n.render.bind(n);n.render=function(...t){const e=n.__owl__;let o="render";return e.isMounted||e.currentFiber||(o+=" (warning: component is not mounted, this render has no effect)"),c(o),h(...t)};const p=n.mount.bind(n);n.mount=function(...t){return c("mount"),p(...t)}}(s,i,(l=n).id)}})}}),e.logScheduler){let e=t.Component.scheduler.start,n=t.Component.scheduler.stop;t.Component.scheduler.start=function(){this.isRunning||console.log(`${o} scheduler: start running tasks queue`),e.call(this)},t.Component.scheduler.stop=function(){this.isRunning&&console.log(`${o} scheduler: stop running tasks queue`),n.call(this)}}if(e.logStore){let e=t.Store.prototype.dispatch;t.Store.prototype.dispatch=function(t,...n){return console.log(`${o} store: action '${t}' dispatched. Payload: '${r(n)}'`),e.call(this,t,...n)}}}
// debugOwl(owl, {
//   // componentBlackList: /App/,  // regexp
//   // componentWhiteList: /SomeComponent/, // regexp
//   // methodBlackList: ["mounted"], // list of method names
//   // methodWhiteList: ["willStart"], // list of method names
//   logScheduler: false,  // display/mute scheduler logs
//   logStore: true,     // display/mute store logs
// });
//
