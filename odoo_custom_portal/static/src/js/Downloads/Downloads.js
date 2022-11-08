/** @odoo-module **/

import {useService,} from "@web/core/utils/hooks";
const {Component} = owl;
const {useState,useEffect} = owl;

export class Downloads extends Component {


    setup() {
        this.rpcService = useService("rpc");
        this.orm = useService("orm");
        this.actionService = useService("action");
        this.notificationService = useService("notification");

        this.state = useState({
            payslips_data: {},
            employee_data: {},
        })

        this.loading = useState({
            is_loading: false,
        })


        useEffect(
            () => {
                this.loading.is_loading = true
                this.getDataUpdateState().then((data) => {
                    this.loading.is_loading = false
                    if (data.length > 0) {
                        // this.state.payslips_data = data[0].payslips_data
                        this.state.employee_data = data[0].employee_data
                    }
                })
            },
            () => []
        );
    }

    getDataUpdateState = async (part_id) => {

        let data = await this.rpcService(`/odoo_custom_portal/payslips_data`, {page_number: 1, items_per_page: 10});
        // console.log(data)
        return data
    }


}

export class DownloadsPaySlipTable extends Component {


    setup() {
        this.rpcService = useService("rpc");
        this.orm = useService("orm");
        this.actionService = useService("action");
        this.notificationService = useService("notification");

        this.state = useState({
            payslips_data: {},
            payslips_count: 0,
            current_page: 1,
            items_per_page: 10,
            all_selected: false,
            selected_items: []
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
                        this.state.payslips_data = data[0].payslips_data
                        this.state.payslips_count = data[0].payslips_count
                        this.state.selected_items = []
                    }
                })
            },
            () => [this.state.current_page]
        );
    }

    backButton = () => {
        // console.log(this.state.current_page)
        if (this.state.current_page > 1) {
            this.state.current_page -= 1
            this.state.all_selected = false
            this.state.selected_items = []
        }
    }
    nextButton = () => {
        if (this.state.payslips_count > this.state.items_per_page * this.state.current_page) {
            this.state.current_page += 1
            this.state.all_selected = false
            this.state.selected_items = []
        }
    }
    selectAllItems = () => {
        let selected_items = []
        if (this.state.all_selected) {
            let payslips_data = this.state.payslips_data.map((line) => {
                return {...line, is_selected: false}
            })
            this.state.payslips_data = payslips_data
            this.state.all_selected = false
            this.state.selected_items = []
        } else if (!this.state.all_selected) {
            let payslips_data = this.state.payslips_data.map((line) => {
                selected_items.push(line.id)
                return {...line, is_selected: true}
            })
            Object.assign(this.state, {
                payslips_data: payslips_data,
                all_selected: true,
                selected_items: selected_items
            })
        }

    }
    selectIndividualItem = (id) => {
        // console.log(id)
        let clicked_index = []
        let is_all_selected = true
        let selected_items = []
        let payslips_data = this.state.payslips_data.map((line, index) => {
            if (line.id === id) {
                clicked_index.push(index)
                if (line.is_selected) {
                    this.state.selected_items.forEach((selected_item) => {
                        if (selected_item !== line.id) {
                            selected_items.push(selected_item)
                        }
                    })
                } else {
                    selected_items = [...this.state.selected_items, line.id]
                }

                return {...line, is_selected: !line.is_selected}
            } else {
                return line
            }
        })

        payslips_data.forEach((line)=>{
            if(is_all_selected){
                is_all_selected =line.is_selected
            }
        })



        // console.log(clicked_index)
        if (clicked_index.length === 1) {
            this.state.payslips_data=payslips_data
            this.state.selected_items = selected_items
            this.state.all_selected = is_all_selected
            // console.log(selected_items)
            // console.log(is_all_selected)


        }

    }
    printReport = async () => {
        let url_list = '?list_ids='+ this.state.selected_items.toString();
                    this.actionService.doAction(
                {
                    type: 'ir.actions.act_url',
                    url:'/my/payslips/pdf/download' + url_list

                }
            )


    }

    getDataUpdateState = async (page_number, items_per_page) => {

        let data = await this.rpcService(`/odoo_custom_portal/payslips_data`, {
            page_number: page_number,
            items_per_page: items_per_page
        });
        // console.log(data)
        return data
    }


}


Downloads.template = "odoo_custom_portal.Downloads"
DownloadsPaySlipTable.template = "odoo_custom_portal.DownloadsPaySlipTable"
Downloads.components = {
    DownloadsPaySlipTable
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
