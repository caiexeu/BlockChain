App = {
  web3Provider: null,
  contracts: {},

  init: async function () {
    // Load pets.
    $.getJSON('../pets.json', function (data) {
      var petsRow = $('#petsRow')
      var petTemplate = $('#petTemplate')

      for (i = 0; i < data.length; i++) {
        petTemplate.find('.panel-title').text(data[i].name)
        petTemplate.find('img').attr('src', data[i].picture)
        petTemplate.find('.pet-breed').text(data[i].breed)
        petTemplate.find('.pet-age').text(data[i].age)
        petTemplate.find('.pet-location').text(data[i].location)
        petTemplate.find('.btn-adopt').attr('data-id', data[i].id)

        petsRow.append(petTemplate.html())
      }
    })

    return await App.initWeb3()
  },

  initWeb3: async function () {
    if (window.ethereum) {
      App.web3Provider = window.ethereum

      try {
        await window.ethereum.request({ method: 'eth_requestAccounts' });;
      } catch (error) {
        console.error("User denied account access")
      }
    } else if (window.web3) {
      App.web3Provider = window.web3.currentProvider
    } else {
      App.web3Provider = new Web3.providers.HttpProvider("http://localhost:7545")
    }

    web3 = new Web3(App.web3Provider)

    return App.initContract()
  },

  initContract: function () {
    $.getJSON('Marketplace.json', function (data) {
      var MarketplaceArtifact = data
      App.contracts.Marketplace = TruffleContract(MarketplaceArtifact)

      App.contracts.Marketplace.setProvider(App.web3Provider)

      return App.markBought()
    })

    return App.bindEvents()
  },

  bindEvents: function () {
    $(document).on('click', '.btn-adopt', App.handleAdopt)
  },

  markBought: function () {
    var marketplaceInstance

    App.contracts.Marketplace.deployed().then(function (instance) {
      marketplaceInstance = instance

      return marketplaceInstance.getBuyers.call()
    }).then(function (buyers) {
      for (i = 0; i < buyers.length; i++) {
        if (buyers[i] !== '0x0000000000000000000000000000000000000000') {
          $('.panel-pet').eq(i).find('button').text('Success').attr('disabled', true)
        }
      }
    }).catch(function (err) {
      console.log(err.message)
    })
  },

  handleAdopt: function (event) {
    event.preventDefault()

    var productId = parseInt($(event.target).data('id'))

    var marketplaceInstance

    web3.eth.getAccounts(function (error, accounts) {
      if (error) {
        console.log(error)
      }

      var account = accounts[0]

      App.contracts.Marketplace.deployed().then(function (instance) {
        marketplaceInstance = instance

        return marketplaceInstance.buy(productId, { from: account })
      }).then(function (result) {
        return App.markBought()
      }).catch(function (err) {
        console.log(err.message)
      })
    })
  }
}

$(function () {
  $(window).load(function () {
    App.init()
  })
})
