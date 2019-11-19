/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

export function MonitoringPageProvider({ getPageObjects, getService }) {
  const PageObjects = getPageObjects(['common', 'header', 'shield', 'spaceSelector']);
  const testSubjects = getService('testSubjects');
  const security = getService('security');
  const retry = getService('retry');
  const find = getService('find');

  return new class MonitoringPage {
    async navigateTo(useSuperUser = false) {
      // always create this because our tear down tries to delete it
      await security.user.create('basic_monitoring_user', {
        password: 'monitoring_user_password',
        roles: ['monitoring_user', 'kibana_user'],
        full_name: 'basic monitoring',
      });

      if (!useSuperUser) {
        await PageObjects.common.navigateToApp('login');
        await PageObjects.shield.login(
          'basic_monitoring_user',
          'monitoring_user_password'
        );
      }
    async getWelcome() {
      const el = await find.byCssSelector('.euiCallOut--primary', 10000 * 10);
      return await el.getVisibleText();
    }

    async navigateTo() {
      await PageObjects.common.navigateToApp('monitoring');
    }

    async getAccessDeniedMessage() {
      return testSubjects.getVisibleText('accessDeniedTitle');
    }

    async clickBreadcrumb(subj) {
      return testSubjects.click(subj);
    }

    async assertTableNoData(subj) {
      await retry.try(async () => {
        if (!await testSubjects.exists(subj)) {
          throw new Error('Expected to find the no data message');
        }
      });
    }

    async assertEuiTableNoData(subj) {
      await retry.try(async () => {
        if (await testSubjects.exists(subj)) {
          throw new Error('Expected to find the no data message');
        }
      });
    }

    async tableGetRows(subj) {
      const table = await testSubjects.find(subj);
      return table.findAllByTagName('tr');
    }

    async tableGetRowsFromContainer(subj) {
      const table = await testSubjects.find(subj);
      const tbody = await table.findByTagName('tbody');
      return tbody.findAllByTagName('tr');
    }

    async tableSetFilter(subj, text) {
      await testSubjects.setValue(subj, text);
      await PageObjects.common.pressEnterKey();
      await PageObjects.header.waitUntilLoadingHasFinished();
    }

    async tableClearFilter(subj) {
      return await testSubjects.setValue(subj, ' \uE003'); // space and backspace to trigger onChange event
    }
  };
}
