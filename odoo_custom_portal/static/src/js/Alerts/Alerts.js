/** @odoo-module **/

import {useService,} from "@web/core/utils/hooks";

const {Component} = owl;
const {useState, onWillStart, useExternalListener, useRef,useEffect} = owl;

export class Alerts extends Component {


    setup() {
        this.rpcService = useService("rpc");
        this.orm = useService("orm");
        this.actionService = useService("action");
        this.notificationService = useService("notification");

        this.state = useState({
            warnings_data: [],
            warnings_count:0,
            current_page: 1,
            items_per_page: 30,
            popup_active: false,
            popup_active_data: false
        })

        this.loading = useState({
            is_loading: true,
        })


        useEffect(
            () => {
                this.loading.is_loading = true
                this.getDataUpdateState(this.state.current_page, this.state.items_per_page).then((data) => {
                    this.loading.is_loading = false
                    if (data.length > 0) {
                        this.state.warnings_data = data[0].warnings_data
                        this.state.warnings_count = data[0].warnings_count
                    }
                })
            },
            () => [this.state.current_page]
        );
    }

    getDataUpdateState = async (page_number, items_per_page) => {

        let data = await this.rpcService(`/odoo_custom_portal/warnings`, {
            page_number: page_number,
            items_per_page: items_per_page
        });
        // console.log(data)
        return data
    }
}
export class AlertsKanban extends Component {


    setup() {
        this.rpcService = useService("rpc");
        this.orm = useService("orm");
        this.actionService = useService("action");
        this.notificationService = useService("notification");

        this.state = useState({
            warnings_data: [],
            warnings_count:0,
            current_page: 1,
            items_per_page: 30,
            popup_active: false,
            popup_active_data: false
        })

        this.loading = useState({
            is_loading: false,
        })


        useEffect(
            () => {
                this.loading.is_loading = true
                this.getDataUpdateState(this.state.current_page, this.state.items_per_page).then((data) => {
                    this.loading.is_loading = false
                    if (data.length > 0) {
                        this.state.warnings_data = data[0].warnings_data
                        this.state.warnings_count = data[0].warnings_count
                    }
                })
            },
            () => [this.state.current_page]
        );
    }

    getDataUpdateState = async (page_number, items_per_page) => {

        let data = await this.rpcService(`/odoo_custom_portal/warnings`, {
            page_number: page_number,
            items_per_page: items_per_page
        });
        // console.log(data)
        return data
    }

    enablePopUp = (notice) => {
        this.state.popup_active = true
        this.state.popup_active_data = notice
    }
    disablePopUp = (notice) => {
        this.state.popup_active = false
        this.state.popup_active_data = false
    }
        backButton = () => {
        // console.log(this.state.current_page)
        if (this.state.current_page > 1) {
            this.state.current_page -= 1
        }
    }
    nextButton = () => {
        // console.log(this.state.current_page)
        if (this.state.warnings_count > this.state.items_per_page * this.state.current_page) {
            this.state.current_page += 1
        }
    }


}



Alerts.template = "odoo_custom_portal.Alerts"
AlertsKanban.template = "odoo_custom_portal.AlertsKanban"
Alerts.components = {
    AlertsKanban
}
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
