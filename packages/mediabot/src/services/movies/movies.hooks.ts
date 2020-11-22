// import { disallow } from 'feathers-hooks-common'

import createdAt from '../../hooks/created-at'

import updatedAt from '../../hooks/updated-at'

export default {
  before: {
    all: [],
    find: [],
    get: [],
    create: [createdAt()],
    update: [updatedAt()],
    patch: [updatedAt()],
    remove: [],
  },

  after: {
    all: [],
    find: [],
    get: [],
    create: [],
    update: [],
    patch: [],
    remove: [],
  },

  error: {
    all: [],
    find: [],
    get: [],
    create: [],
    update: [],
    patch: [],
    remove: [],
  },
}
