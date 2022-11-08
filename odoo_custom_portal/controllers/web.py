# -*- coding: utf-8 -*-
# Part of Odoo. See LICENSE file for full copyright and licensing details.

from lxml import etree, html
import odoo
import io
import re
from odoo import http
import operator
from odoo.addons.web.controllers import main
from odoo.http import content_disposition, Controller, request, route
from odoo.addons.portal.controllers.portal import CustomerPortal
from odoo.tools.misc import str2bool, xlsxwriter, file_open, file_path
from odoo.addons.base.models.ir_qweb import render as qweb_render
from odoo.tools import float_round
from odoo import exceptions, SUPERUSER_ID
from odoo.tools import consteq
from PyPDF2 import PdfFileReader, PdfFileWriter
from odoo.tools.safe_eval import safe_eval
from odoo.exceptions import AccessError, UserError, AccessDenied
from odoo.tools.translate import _
from odoo.tools.image import image_guess_size_from_field_name

DBNAME_PATTERN = '^[a-zA-Z0-9][a-zA-Z0-9_.-]+$'


# db_monodb = http.db_monodb


class PortalHomePage(CustomerPortal):

    def _prepare_project_sharing_session_info(self):
        session_info = request.env['ir.http'].sudo().session_info()
        # print(session_info)
        # user_context = request.session.get_context() if request.session.uid else {}
        # project_company = request.env['res.company'].sudo().search([
        #     ('id', '=', (request.env.context['allowed_company_ids'][0])), ], limit=1)
        # session_info.update(
        #     user_companies={
        #         'current_company': project_company.id,
        #         'allowed_companies': {
        #             project_company.id: {
        #                 'id': project_company.id,
        #                 'name': project_company.name,
        #             },
        #         },
        #     },
        #     # FIXME: See if we prefer to give only the currency that the portal user just need to see the correct information in project sharing
        #     # currencies=request.env['ir.http'].get_currencies(),
        # )
        return session_info

    @http.route(['/my', '/my/home'], type='http', auth="user", )
    def home(self, **kw):
        res = super(PortalHomePage, self).home(**kw)
        values = self._prepare_portal_layout_values()
        # print('gotacha')
        # action_id = request.env.ref('odoo_custom_portal.HomePage2')
        # print(action_id.id)
        # return request.render("odoo_custom_portal.web_frontend_layout_home")

        return request.render("odoo_custom_portal.web_frontend_layout_home",
                              {'session_info': self._prepare_project_sharing_session_info()}, )

    #
    # def _prepare_project_sharing_session_info(self, project, task=None):
    #     session_info = request.env['ir.http'].session_info()
    #     user_context = dict(request.env.context) if request.session.uid else {}
    #     mods = conf.server_wide_modules or []
    #     if request.env.lang:
    #         lang = request.env.lang
    #         session_info['user_context']['lang'] = lang
    #         # Update Cache
    #         user_context['lang'] = lang
    #     lang = user_context.get("lang")
    #     translation_hash = request.env['ir.http'].get_web_translations_hash(mods, lang)
    #     cache_hashes = {
    #         "translations": translation_hash,
    #     }
    #
    #     project_company = project.company_id
    #     session_info.update(
    #         cache_hashes=cache_hashes,
    #         action_name='project.project_sharing_project_task_action',
    #         project_id=project.id,
    #         user_companies={
    #             'current_company': project_company.id,
    #             'allowed_companies': {
    #                 project_company.id: {
    #                     'id': project_company.id,
    #                     'name': project_company.name,
    #                 },
    #             },
    #         },
    #         # FIXME: See if we prefer to give only the currency that the portal user just need to see the correct information in project sharing
    #         currencies=request.env['ir.http'].get_currencies(),
    #     )
    #     if task:
    #         session_info['open_task_action'] = task.action_project_sharing_open_task()
    #     return session_info
    #
    # @http.route("/my/projects/<int:project_id>/project_sharing", type="http", auth="user", methods=['GET'])
    # def render_project_backend_view(self, project_id, task_id=None):
    #     project = request.env['project.project'].sudo().browse(project_id)
    #     if not project.exists() or not project.with_user(request.env.user)._check_project_sharing_access():
    #         return request.not_found()
    #     task = task_id and request.env['project.task'].browse(int(task_id))
    #     return request.render(
    #         'project.project_sharing_embed',
    #         {'session_info': self._prepare_project_sharing_session_info(project, task)},
    #     )
    #

    @http.route(['/my/shift-gannt-view'], type='http', auth="user", )
    def shift_view(self, **kw):
        # values = self._prepare_portal_layout_values()
        # print('gotacha')
        # action_id = request.env.ref('odoo_custom_portal.HomePage2')
        # print(action_id.id)
        # return request.render("odoo_custom_portal.odoo_custom_portal_shift")
        return request.render("odoo_custom_portal.odoo_custom_portal_shift",
                              {'session_info': self._prepare_project_sharing_session_info()}, )

    @http.route(['/odoo_custom_portal/dashboard_data'], type='json', auth="user", website=True)
    def dash_board(self, page_number, items_per_page):
        data = []
        employee_id = request.env.user.employee_id.id
        employee = request.env['hr.employee'].sudo().browse(employee_id)
        attendances = request.env['hr.attendance'].sudo().search([('employee_id', '=', employee_id)],
                                                                 limit=items_per_page,
                                                                 order='id DESC',
                                                                 offset=(page_number - 1) * items_per_page)
        attendances_count = request.env['hr.attendance'].sudo().search_count([('employee_id', '=', employee_id)])
        leave_balances_data = request.env['hr.leave.type'].sudo().get_days_all_request()
        leave_requests = request.env['hr.leave'].sudo().search([('employee_id', '=', employee_id)],
                                                               limit=items_per_page,
                                                               order='id DESC',
                                                               offset=(page_number - 1) * items_per_page)
        leave_requests_count = request.env['hr.leave'].sudo().search_count([('employee_id', '=', employee_id)])
        employee_data = {}
        leave_requests_data = []
        attendances_data = []

        if len(employee) == 1:
            employee_data = {
                'id': employee.id,
                'name': employee.name,
                'job_title': employee.job_title,
                'mobile_phone': employee.mobile_phone,
                'work_email': employee.work_email,
                'work_phone': employee.work_phone,
                'department_id': [employee.department_id.id,
                                  employee.department_id.name] if employee.department_id.id else False,
                'parent_id': [employee.parent_id.id, employee.parent_id.name] if employee.parent_id.id else False,
                'coach_id': [employee.coach_id.id, employee.coach_id.name] if employee.coach_id.id else False,
                'leave_manager_id': [employee.leave_manager_id.id,
                                     employee.leave_manager_id.name] if employee.leave_manager_id.id else False,
                'expense_manager_id': [employee.expense_manager_id.id,
                                       employee.expense_manager_id.name] if employee.expense_manager_id.id else False,
                'timesheet_manager_id': [employee.timesheet_manager_id.id,
                                         employee.timesheet_manager_id.name] if employee.timesheet_manager_id.id else False,
                'work_location_id': [employee.work_location_id.id,
                                     employee.work_location_id.name] if employee.work_location_id.id else False,
                'private_email': employee.private_email,
                'phone': employee.phone,
                'children': employee.children,
                'gender': employee.gender,
                'marital': dict(employee._fields['marital'].selection)[employee.marital] if employee.marital else False,
                'emergency_contact': employee.emergency_contact,
                'emergency_phone': employee.emergency_phone,
                'birthday': employee.birthday,
                'resource_calendar_id': [employee.resource_calendar_id.id,
                                         employee.resource_calendar_id.name] if employee.resource_calendar_id.id else False,
                'tz': employee.tz,
                'countries_ids': [[country.id, country.display_name] for country in
                                  request.env['res.country'].sudo().search([])],
                'state_ids': [{state.id, state.display_name} for state in
                              request.env['res.country.state'].sudo().search([])]

            }

        for attendance in attendances:
            attendances_data.append({
                'id': attendance.id,
                'check_in': attendance.check_in,
                'check_out': attendance.check_out,
                'worked_hours': attendance.worked_hours
            })

        def leave_request_colors(state):
            if state == 'draft':
                return {'background': '#8acfda'}
            elif state == 'confirm':
                return {'background': '#ffd57f'}
            elif state == 'refuse':
                return {'background': '#e8e8e8'}
            elif state == 'validate':
                return {'background': '#93d3a2'}
            elif state == 'validate1':
                return {'background': '#ffd57f'}

        for leave_request in leave_requests:
            # print(dict(leave_request._fields['state'].selection)[leave_request.state])
            leave_requests_data.append({
                'id': leave_request.id,
                'holiday_status_id': [leave_request.holiday_status_id.id,
                                      leave_request.holiday_status_id.name] if leave_request.holiday_status_id.id else False,
                'date_from': leave_request.date_from,
                'date_to': leave_request.date_to,
                'duration_display': leave_request.duration_display,
                'state': dict(leave_request._fields['state'].selection)[leave_request.state],
                'state_colors': leave_request_colors(leave_request.state)
            })

        return [{'employee_data': employee_data, 'attendances_data': attendances_data,
                 'attendances_count': attendances_count,
                 'leave_balances_data': leave_balances_data, 'leave_requests_data': leave_requests_data,
                 'leave_requests_count': leave_requests_count}]

    @http.route(['/odoo_custom_portal/my-profile'], type='json', auth="user", website=True)
    def my_profile(self, ):
        data = []
        employee_id = request.env.user.employee_id.id
        employee = request.env['hr.employee'].sudo().browse(employee_id)

        employee_data = {}
        if len(employee) == 1:
            # print(employee.gender)
            employee_data = {
                'id': employee.id,
                'name': employee.name,
                'job_title': employee.job_title,
                'mobile_phone': employee.mobile_phone,
                'work_email': employee.work_email,
                'work_phone': employee.work_phone,
                'department_id': [employee.department_id.id,
                                  employee.department_id.name] if employee.department_id.id else False,
                'parent_id': [employee.parent_id.id, employee.parent_id.name] if employee.parent_id.id else False,
                'coach_id': [employee.coach_id.id, employee.coach_id.name] if employee.coach_id.id else False,
                'leave_manager_id': [employee.leave_manager_id.id,
                                     employee.leave_manager_id.name] if employee.leave_manager_id.id else False,
                'expense_manager_id': [employee.expense_manager_id.id,
                                       employee.expense_manager_id.name] if employee.expense_manager_id.id else False,
                'timesheet_manager_id': [employee.timesheet_manager_id.id,
                                         employee.timesheet_manager_id.name] if employee.timesheet_manager_id.id else False,
                'work_location_id': [employee.work_location_id.id,
                                     employee.work_location_id.name] if employee.work_location_id.id else False,
                'private_email': employee.private_email,
                'phone': employee.phone,
                'children': employee.children,
                'gender': employee.gender,
                'genders': dict(employee._fields['gender'].selection),
                'marital': employee.marital,
                'marital_statuses': dict(employee._fields['marital'].selection),
                'emergency_contact': employee.emergency_contact,
                'emergency_phone': employee.emergency_phone,
                'birthday': employee.birthday,
                'resource_calendar_id': [employee.resource_calendar_id.id,
                                         employee.resource_calendar_id.name] if employee.resource_calendar_id else False,
                'tz': employee.tz,
                'countries_ids': [[country.id, country.display_name] for country in
                                  request.env['res.country'].sudo().search([])],
                'state_ids': [[state.id, state.display_name] for state in
                              request.env['res.country.state'].sudo().search(
                                  [('country_id', '=', employee.address_home_id.country_id.id)])],
                'address_home_id': {'street': employee.address_home_id.street,
                                    'street2': employee.address_home_id.street2,
                                    'city': employee.address_home_id.city,
                                    'state_id': [employee.address_home_id.state_id.id,
                                                 employee.address_home_id.state_id.name] if employee.address_home_id.state_id else False,
                                    'zip': employee.address_home_id.zip,
                                    'country_id': [employee.address_home_id.country_id.id,
                                                   employee.address_home_id.country_id.name] if employee.address_home_id.country_id else False,
                                    }

            }

        return [{'employee_data': employee_data, }]

    @http.route(['/odoo_custom_portal/my-profile/save-data'], type='json', auth="user", website=True)
    def my_profile_save_data(self, saving_data):
        data = []
        # print(saving_data)
        employee_id = request.env.user.employee_id.id
        employee = request.env['hr.employee'].sudo().browse(employee_id)
        contact = employee.address_home_id
        if len(saving_data) > 0:
            if len(employee) == 1:
                employee_data = {
                    'birthday': saving_data['birthday'],
                    'marital': saving_data['marital'],
                    'gender': saving_data['gender'],
                    'children': saving_data['children'],
                    'emergency_contact': saving_data['emergency_contact'],
                    'emergency_phone': saving_data['emergency_phone'],
                    'work_phone': saving_data['work_phone'],
                    'work_email': saving_data['work_email'],
                    'mobile_phone': saving_data['mobile_phone'],
                }
                employee.write(employee_data)

            # if len(employee.work_contact_id) == 0:
            #     employee.work_contact_id = employee.work_contact_id.create({
            #         'name': request.env.user.employee_id.name,
            #         'company_id': employee.company_id.id,
            #         'email': saving_data['work_email'],
            #         'mobile': saving_data['mobile_phone'],
            #     }).id
            # else:
            #     address_id = employee.work_contact_id.write({
            #         'email': saving_data['work_email'],
            #         'mobile': saving_data['mobile_phone'],
            #     })

            # if len(employee.address_id) == 1:
            #     address_id = employee.address_id.write({
            #         'phone': saving_data['work_phone'],
            #     })

            if len(employee.address_home_id) == 0:
                # print('creatyd fucker')
                employee.address_home_id = employee.address_home_id.create({
                    'name': employee.name,
                    'email': saving_data['private_email'],
                    'phone': saving_data['phone'],
                    'street': saving_data['address_home_id']['street'],
                    'street2': saving_data['address_home_id']['street2'],
                    'city': saving_data['address_home_id']['city'],
                    'state_id': saving_data['address_home_id']['state_id'],
                    'country_id': saving_data['address_home_id']['country_id'],
                    'zip': saving_data['address_home_id']['zip'],
                    'company_id': employee.company_id.id

                }).id
            else:
                address_id = employee.address_home_id.write({
                    'email': saving_data['private_email'],
                    'phone': saving_data['phone'],
                    'street': saving_data['address_home_id']['street'],
                    'street2': saving_data['address_home_id']['street2'],
                    'city': saving_data['address_home_id']['city'],
                    'state_id': saving_data['address_home_id']['state_id'],
                    'country_id': saving_data['address_home_id']['country_id'],
                    'zip': saving_data['address_home_id']['zip'],

                })
                # employee.address_home_id = contact[0].id

        return True

    @http.route(['/odoo_custom_portal/payslips_data'], type='json', auth="user", website=True)
    def download_payslips(self, page_number, items_per_page):

        employee_id = request.env.user.employee_id.id
        employee = request.env['hr.employee'].sudo().browse(employee_id)
        # ('employee_id', '=', employee_id)
        payslips_count = request.env['hr.payslip'].sudo().search_count([('employee_id', '=', employee_id)])
        payslips = request.env['hr.payslip'].sudo().search([('employee_id', '=', employee_id)], limit=items_per_page,
                                                           order='id DESC', offset=(page_number - 1) * items_per_page)
        payslips_data = []
        employee_data = {}

        def payslip_state_colors(state):
            if state == 'draft':
                return {'background': '#8bd0db'}
            elif state == 'verify':
                return {'background': '#fed47e'}
            elif state == 'done':
                return {'background': '#92d2a1'}
            elif state == 'paid':
                return {'background': '#92d2a1'}
            elif state == 'cancel':
                return {'background': '#e8e8e8'}

        if len(employee) == 1:
            employee_data = {
                'id': employee.id,
                'name': employee.name,
                'job_title': employee.job_title,
                'mobile_phone': employee.mobile_phone,
                'work_email': employee.work_email,
                'work_phone': employee.work_phone,
                'department_id': [employee.department_id.id,
                                  employee.department_id.name] if employee.department_id.id else False,
                'parent_id': [employee.parent_id.id, employee.parent_id.name] if employee.parent_id.id else False,
                'coach_id': [employee.coach_id.id, employee.coach_id.name] if employee.coach_id.id else False,
                'work_location_id': [employee.work_location_id.id,
                                     employee.work_location_id.name] if employee.work_location_id.id else False,
                'resource_calendar_id': [employee.resource_calendar_id.id,
                                         employee.resource_calendar_id.name] if employee.resource_calendar_id.id else False,
                'tz': employee.tz,
                'contract_id': [employee.contract_id.id,
                                employee.contract_id.name] if employee.contract_id.id else False,
                'job_id': [employee.job_id.id,
                           employee.job_id.name] if employee.job_id.id else False,
                'employee_type': dict(employee._fields['employee_type'].selection)[
                    employee.employee_type] if employee.employee_type else False,
                'first_contract_date': employee.first_contract_date

            }

        for payslip in payslips:
            # print(dict(leave_request._fields['state'].selection)[leave_request.state])
            payslips_data.append({
                'id': payslip.id,
                'is_selected': False,
                'number': payslip.number,
                'struct_id': [payslip.struct_id.id,
                              payslip.struct_id.name] if payslip.struct_id.id else False,
                'date_from': payslip.date_from,
                'date_to': payslip.date_to,
                'net_wage': payslip.net_wage,
                'basic_wage': payslip.basic_wage,
                'state': dict(payslip._fields['state'].selection)[payslip.state],
                'state_colors': payslip_state_colors(payslip.state)

            })

        return [{'payslips_data': payslips_data, 'payslips_count': payslips_count, 'employee_data': employee_data, }]

    def _stock_picking_check_access(self, slips_ids, access_token=None):
        pay_slips = request.env['hr.payslip'].browse([slips_ids])
        pay_slips_sudo = pay_slips.sudo()
        try:
            pay_slips.check_access_rights('read')
            pay_slips.check_access_rule('read')
        except exceptions.AccessError:
            if not access_token or not consteq(pay_slips_sudo.sale_id.access_token, access_token):
                raise
        return pay_slips_sudo

    # error check access
    @route(["/my/payslips/pdf/download"], type='http', auth="user", website=True)
    def get_payroll_report_print(self, list_ids='', **post):
        if not request.env.user.has_group('hr_payroll.group_hr_payroll_user') or not list_ids or re.search("[^0-9|,]",
                                                                                                           list_ids):
            return request.not_found()

        ids = [int(s) for s in list_ids.split(',')]
        payslips = request.env['hr.payslip'].browse(ids)

        pdf_writer = PdfFileWriter()

        for payslip in payslips:
            if not payslip.struct_id or not payslip.struct_id.report_id:
                report = request.env.ref('hr_payroll.action_report_payslip', False)
            else:
                report = payslip.struct_id.report_id
            pdf_content, _ = request.env['ir.actions.report']. \
                with_context(lang=payslip.employee_id.sudo().address_home_id.lang). \
                sudo(). \
                _render_qweb_pdf(report, payslip.id, data={'company_id': payslip.company_id})
            reader = PdfFileReader(io.BytesIO(pdf_content), strict=False, overwriteWarnings=False)

            for page in range(reader.getNumPages()):
                pdf_writer.addPage(reader.getPage(page))

        _buffer = io.BytesIO()
        pdf_writer.write(_buffer)
        merged_pdf = _buffer.getvalue()
        _buffer.close()

        if len(payslips) == 1 and payslips.struct_id.report_id.print_report_name:
            report_name = safe_eval(payslips.struct_id.report_id.print_report_name, {'object': payslips})
        else:
            report_name = "Payslips"

        pdfhttpheaders = [
            ('Content-Type', 'application/pdf'),
            ('Content-Length', len(merged_pdf)),
            ('Content-Disposition', content_disposition(report_name + '.pdf'))
        ]

        return request.make_response(merged_pdf, headers=pdfhttpheaders)

    @http.route(['/odoo_custom_portal/warnings'], type='json', auth="user", website=True)
    def warnings(self, page_number, items_per_page):

        employee_id = request.env.user.employee_id.id
        employee = request.env['hr.employee'].sudo().browse(employee_id)
        # ('employee_id', '=', employee_id)
        warnings_types = request.env['hc.warning.type'].sudo().search(
            ['|', ('type', '=', 'warning'), ('type', '=', 'notice')], )
        domain = []
        for warning_type in warnings_types:
            domain.append(warning_type.id)
        # print(tuple(domain))

        warnings_count = request.env['hc.warning'].sudo().search_count(
            [('type_id', 'in', tuple(domain)), ('employee_id', '=', employee_id)])
        warnings = request.env['hc.warning'].sudo().search(
            [('type_id', 'in', tuple(domain)), ('employee_id', '=', employee_id)],
            limit=items_per_page,
            order='id DESC', offset=(page_number - 1) * items_per_page)
        # print(warnings_count)
        # print(warnings)
        # '&', ('type', '=', 'warning'), ('type', '=', 'notice'),]
        warnings_data = []

        for warning in warnings:
            # print(dict(leave_request._fields['state'].selection)[leave_request.state])
            # if warning.type_id.type == 'warning' or warning.type_id.type == 'notice':
            warnings_data.append({
                'id': warning.id,
                'name': warning.name,
                'employee_id': [warning.employee_id.id,
                                warning.employee_id.name] if warning.employee_id else False,
                'department_id': [warning.department_id.id,
                                  warning.department_id.name] if warning.department_id else False,
                'type_id': [warning.type_id.id,
                            warning.type_id.name] if warning.type_id else False,
                'description': warning.type_id.description,
                'message': warning.type_id.message,
                'type': dict(warning.type_id._fields['type'].selection)[
                    warning.type_id.type] if warning.type_id.type else False,
                'warning_level_ids': [{'id': level.warning_level_id.id, 'name': level.warning_level_id.name,
                                       'level': level.warning_level_id.level} for level in
                                      warning.warning_level_ids],
                'attachment_ids': [
                    {'id': attachment.id, 'local_url': attachment.local_url, 'display_name': attachment.display_name,
                     'website_url': attachment.website_url} for attachment in warning.attachment_ids]
            })

        return [{'warnings_data': warnings_data, 'warnings_count': warnings_count, }]

    @http.route(['/odoo_custom_portal/newsletter'], type='json', auth="user", website=True)
    def newsletter(self, page_number, items_per_page):

        employee_id = request.env.user.employee_id.id
        employee = request.env['hr.employee'].sudo().browse(employee_id)

        warnings_types = request.env['hc.warning.type'].sudo().search(
            [('type', '=', 'circular')], )
        domain = []
        for warning_type in warnings_types:
            domain.append(warning_type.id)
        # print(tuple(domain))

        circulars_count = request.env['hc.warning'].sudo().search_count(
            [('type_id', 'in', tuple(domain)), ('employee_id', '=', employee_id)])
        circulars = request.env['hc.warning'].sudo().search(
            [('type_id', 'in', tuple(domain)), ('employee_id', '=', employee_id)],
            limit=items_per_page,
            order='id DESC', offset=(page_number - 1) * items_per_page)
        circulars_data = []

        for circular in circulars:
            # print(dict(leave_request._fields['state'].selection)[leave_request.state])
            if circular.type_id.type == 'circular':
                circulars_data.append({
                    'id': circular.id,
                    'name': circular.name,
                    'employee_id': [circular.employee_id.id,
                                    circular.employee_id.name] if circular.employee_id else False,
                    'department_id': [circular.department_id.id,
                                      circular.department_id.name] if circular.department_id else False,
                    'type_id': [circular.type_id.id,
                                circular.type_id.name] if circular.type_id else False,
                    'description': circular.type_id.description,
                    'message': circular.type_id.message,
                    'type': dict(circular.type_id._fields['type'].selection)[
                        circular.type_id.type] if circular.type_id.type else False,
                    'warning_level_ids': [{'id': level.warning_level_id.id, 'name': level.warning_level_id.name,
                                           'level': level.warning_level_id.level} for level in
                                          circular.warning_level_ids],
                    'attachment_ids': [
                        {'id': attachment.id, 'local_url': attachment.local_url,
                         'display_name': attachment.display_name,
                         'website_url': attachment.website_url} for attachment in circular.attachment_ids]
                })

        return [{'circulars_data': circulars_data, 'circulars_count': circulars_count, }]

    @http.route(['/portal/web/image',
                 '/portal/web/image/<string:xmlid>',
                 '/portal/web/image/<string:xmlid>/<string:filename>',
                 '/portal/web/image/<string:xmlid>/<int:width>x<int:height>',
                 '/portal/web/image/<string:xmlid>/<int:width>x<int:height>/<string:filename>',
                 '/portal/web/image/<string:model>/<int:id>/<string:field>',
                 '/portal/web/image/<string:model>/<int:id>/<string:field>/<string:filename>',
                 '/portal/web/image/<string:model>/<int:id>/<string:field>/<int:width>x<int:height>',
                 '/portal/web/image/<string:model>/<int:id>/<string:field>/<int:width>x<int:height>/<string:filename>',
                 '/portal/web/image/<int:id>',
                 '/portal/web/image/<int:id>/<string:filename>',
                 '/portal/web/image/<int:id>/<int:width>x<int:height>',
                 '/portal/web/image/<int:id>/<int:width>x<int:height>/<string:filename>',
                 '/portal/web/image/<int:id>-<string:unique>',
                 '/portal/web/image/<int:id>-<string:unique>/<string:filename>',
                 '/portal/web/image/<int:id>-<string:unique>/<int:width>x<int:height>',
                 '/portal/web/image/<int:id>-<string:unique>/<int:width>x<int:height>/<string:filename>'], type='http',
                auth="user")
    # def content_image(self, xmlid=None, model='ir.attachment', id=None, field='datas',
    #                   filename_field='name', unique=None, filename=None, mimetype=None,
    #                   download=None, width=0, height=0, crop=False, access_token=None,
    #                   **kwargs):
    #     # other kwargs are ignored on purpose
    #     return request.env['ir.http'].with_user(SUPERUSER_ID)._content_image(xmlid=xmlid, model=model, res_id=id,
    #                                                                          field=field,
    #                                                                          filename_field=filename_field,
    #                                                                          unique=unique, filename=filename,
    #                                                                          mimetype=mimetype,
    #                                                                          download=download, width=width,
    #                                                                          height=height, crop=crop,
    #                                                                          quality=int(kwargs.get('quality', 0)),
    #                                                                          access_token=access_token)
    def content_image(self, xmlid=None, model='ir.attachment', id=None, field='raw',
                      filename_field='name', filename=None, mimetype=None, unique=False,
                      download=False, width=0, height=0, crop=False, access_token=None,
                      nocache=False):
        try:
            record = request.env['ir.binary'].with_user(SUPERUSER_ID)._find_record(xmlid, model, id and int(id),
                                                                                   access_token)
            stream = request.env['ir.binary'].with_user(SUPERUSER_ID)._get_image_stream_from(
                record, field, filename=filename, filename_field=filename_field,
                mimetype=mimetype, width=int(width), height=int(height), crop=crop,
            )
        except UserError as exc:
            if download:
                raise request.not_found() from exc
            # Use the ratio of the requested field_name instead of "raw"
            if (int(width), int(height)) == (0, 0):
                width, height = image_guess_size_from_field_name(field)
            record = request.env.ref('web.image_placeholder').sudo()
            stream = request.env['ir.binary'].with_user(SUPERUSER_ID)._get_image_stream_from(
                record, 'raw', width=int(width), height=int(height), crop=crop,
            )

        send_file_kwargs = {'as_attachment': download}
        if unique:
            send_file_kwargs['immutable'] = True
            send_file_kwargs['max_age'] = http.STATIC_CACHE_LONG
        if nocache:
            send_file_kwargs['max_age'] = None

        return stream.get_response(**send_file_kwargs)

    @http.route('/portal/web/session/change_password', type='json', auth="user")
    def change_password(self, fields):
        # print(fields)
        old_password = fields['old_password']
        new_password = fields['new_password']
        confirm_password = fields['confirm_password']

        if not (old_password.strip() and new_password.strip() and confirm_password.strip()):
            return {'error': _('You cannot leave any password empty.')}
        if new_password != confirm_password:
            return {'error': _('The new password and its confirmation must be identical.')}

        msg = _("Error, password not changed !")
        try:
            if request.env['res.users'].change_password(old_password, new_password):
                return {'new_password': new_password}
        except AccessDenied as e:
            msg = e.args[0]
            if msg == AccessDenied().args[0]:
                msg = _('The old password you provided is incorrect, your password was not changed.')
        except UserError as e:
            msg = e.args[0]
        return {'error': msg}
