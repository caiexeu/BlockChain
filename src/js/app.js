App = {
  web3Provider: null,
  contracts: {},

  init: async function () {
    // Load products.
    $.getJSON('../products.json', function (data) {
      var productsRow = $('#productsRow')
      var productTemplate = $('#productTemplate')

      for (i = 0; i < data.length; i++) {
        productTemplate.find('.panel-title').text(data[i].name)
        productTemplate.find('img').attr('src', data[i].picture)
        productTemplate.find('.product-brand').text(data[i].brand)
        productTemplate.find('.product-price').text(data[i].price)
        productTemplate.find('.btn-Buy').attr('data-id', data[i].id)

        productsRow.append(productTemplate.html())
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
    $(document).on('click', '.btn-Buy', App.handleBuy)
  },

  markBought: function () {
    var marketplaceInstance

    App.contracts.Marketplace.deployed().then(function (instance) {
      marketplaceInstance = instance

      return marketplaceInstance.getBuyers.call()
    }).then(function (buyers) {
      for (i = 0; i < buyers.length; i++) {
        if (buyers[i] !== '0x0000000000000000000000000000000000000000') {
          $('.panel-product').eq(i).find('button').text('Success').attr('disabled', true)
        }
      }
    }).catch(function (err) {
      console.log(err.message)
    })
  },

  handleBuy: function (event) {
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
