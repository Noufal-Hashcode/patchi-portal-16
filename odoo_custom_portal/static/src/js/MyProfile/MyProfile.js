/** @odoo-module **/

import {useService} from "@web/core/utils/hooks";
const {Component} = owl;
const {useState,useEffect} = owl;

export class MyProfile extends Component {


    setup() {
        this.rpcService = useService("rpc");
        this.orm = useService("orm");
        this.actionService = useService("action");
        this.notificationService = useService("notification");

        this.state = useState({
            employee_data: {},
            employee_data_non_edited: {},
            current_page: 1,
            edit_enable: false,
            save_refresh_page: 1,
            old_password: '',
            new_password: '',
            confirm_password: '',
            error_display:false,
            error_msg:'Please check your inputs',
            successful_changes:false
        })

        this.loading = useState({
            is_loading: true,
        })


        useEffect(
            () => {
                this.loading.is_loading = true
                if (Object.keys(this.state.employee_data).length > 0) {
                    this.saveData(this.state.employee_data).then(() => {
                        this.getDataUpdateState().then((data) => {
                            this.loading.is_loading = false
                            if (data.length > 0) {
                                this.state.employee_data = data[0].employee_data
                            }
                        })

                    }).catch((e) => {
                        // console.log(e)
                    })

                } else {
                    this.getDataUpdateState().then((data) => {
                        console.log(data)
                        this.loading.is_loading = false
                        if (data.length > 0) {
                            this.state.employee_data = data[0].employee_data
                        }
                    })
                }
            },
            () => [this.state.save_refresh_page]
        );
    }

    changeTab = (page_number) => {
        this.state.current_page = page_number
    }
    // enablePopUp = (notice) => {
    //     this.state.error_display = true
    //
    // }
    disablePopUp = (notice) => {
        this.state.error_display = false
        this.state.successful_changes = false
        this.state.error_msg= 'Please check your inputs'

    }

    changeCountry = (e) => {
        let country_id = []
        this.state.employee_data.countries_ids.forEach((line) => {
            if (line[0] === parseInt(e.target.value)) {
                country_id = line
            }
        })
        this.state.employee_data.address_home_id.country_id = country_id
        this.state.save_refresh_page += 1
    }
    changeState = (e) => {
        let state_id = []
        this.state.employee_data.state_ids.forEach((line) => {
            if (line[0] === parseInt(e.target.value)) {
                state_id = line
            }
        })
        this.state.employee_data.address_home_id.state_id = state_id
    }
    changeMaritalState = (e) => {
        this.state.employee_data.gender = e.target.value
    }
    changeGender = (e) => {
        this.state.employee_data.marital = e.target.value
    }
    changePassword = async () => {
        let fields = {
            old_password: this.state.old_password,
            new_password: this.state.new_password,
            confirm_password: this.state.confirm_password
        }

        let data = await this.rpcService(`/portal/web/session/change_password`, {fields: fields});
        console.log(data)
        if(data.new_password){
            this.state.successful_changes =true


        }else{
            this.state.error_display =true
            if(data.error){
                this.state.error_msg = data.error
            }

        }
    }

    clickOption = (e) => {
        // console.log(e)
    }
    editButton = () => {
        this.state.edit_enable = true

    }
    discardChanges = () => {
        this.loading.is_loading = true
        this.getDataUpdateState().then((data) => {
            this.loading.is_loading = false
            if (data.length > 0) {
                this.state.employee_data = data[0].employee_data
            }
        })
        this.state.edit_enable = false

    }
    saveChanges = () => {
        this.state.save_refresh_page += 1
        this.state.edit_enable = false
    }

    onChangeField = (e, field) => {
        // console.log(e)

        let value = e.target.value
        // console.log(value)
        if (field === 'private_email') {
            this.state.employee_data.private_email = value
        } else if (field === 'phone') {
            this.state.employee_data.phone = value
        } else if (field === 'birthday') {
            this.state.employee_data.birthday = value
        } else if (field === 'children') {
            this.state.employee_data.children = value
        } else if (field === 'emergency_contact') {
            this.state.employee_data.emergency_contact = value
        } else if (field === 'emergency_phone') {
            this.state.employee_data.emergency_phone = value
        } else if (field === 'street') {
            this.state.employee_data.address_home_id.street = value
        } else if (field === 'street2') {
            this.state.employee_data.address_home_id.street2 = value
        } else if (field === 'city') {
            this.state.employee_data.address_home_id.city = value
        } else if (field === 'zip') {
            this.state.employee_data.address_home_id.zip = value
        } else if (field === 'work_email') {
            this.state.employee_data.work_email = value
        } else if (field === 'mobile_phone') {
            this.state.employee_data.mobile_phone = value
        } else if (field === 'work_phone') {
            this.state.employee_data.work_phone = value
        } else if (field === 'old_password') {
            this.state.old_password = value
        } else if (field === 'new_password') {
            this.state.new_password = value
        } else if (field === 'confirm_password') {
            this.state.confirm_password = value
        }

    }

    getDataUpdateState = async () => {
        let data = await this.rpcService(`/odoo_custom_portal/my-profile`, {
            page_number: 1,
            items_per_page: 10
        });
        // console.log(data)
        return data
    }

    saveData = async (employee_data) => {
        let saving_data = {}
        if (Object.keys(employee_data).length > 0) {
            saving_data = {
                private_email: employee_data.private_email,
                phone: employee_data.phone,
                birthday: employee_data.birthday,
                marital: employee_data.marital,
                gender:employee_data.gender,
                children: employee_data.children,
                emergency_contact: employee_data.emergency_contact,
                emergency_phone: employee_data.emergency_phone,
                work_email: employee_data.work_email,
                mobile_phone: employee_data.mobile_phone,
                work_phone: employee_data.work_phone,
                address_home_id: {
                    street: employee_data.address_home_id.street,
                    street2: employee_data.address_home_id.street2,
                    city: employee_data.address_home_id.city,
                    state_id: employee_data.address_home_id.state_id ? employee_data.address_home_id.state_id[0] : false,
                    country_id: employee_data.address_home_id.country_id ? employee_data.address_home_id.country_id[0] : false,
                    zip: employee_data.address_home_id.zip,
                }
            }
        }
        // console.log(saving_data)

        let data = await this.rpcService(`/odoo_custom_portal/my-profile/save-data`, {
            saving_data: saving_data,
        });
        // console.log(data)
        return data
    }


}


MyProfile.template = "odoo_custom_portal.MyProfile"

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
